const { pool } = require("../../config/db");

function addBillingPeriod(date, cycle) {
    const result = new Date(date);

    if (cycle === "MONTHLY") {
        result.setMonth(result.getMonth() + 1);
    } else if (cycle === "QUARTERLY") {
        result.setMonth(result.getMonth() + 3);
    } else if (cycle === "YEARLY") {
        result.setFullYear(result.getFullYear() + 1);
    }

    return result;
}

function formatDate(date) {
    return date.toISOString().split("T")[0];
}

function generateInvoiceNumber() {
    return `INV-${Date.now()}`;
}


/*
|--------------------------------------------------------------------------
| CREATE HYBRID BILLING
|--------------------------------------------------------------------------
|
| Flow:
|
| Approved/Accepted Quotation
|          ↓
|     Fulfillment Order
|          ↓
|     Billing Engine
|       /       \
|      /         \
| ONE_TIME     RECURRING
|    ↓              ↓
| Invoice      Billing Schedule
|
*/
async function createHybridBilling(quotationId) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // -------------------------------------------------------------
        // 1. Get quotation
        // -------------------------------------------------------------

        const [quotations] = await connection.execute(
            `SELECT *
             FROM quotations
             WHERE id = ?`,
            [quotationId]
        );

        if (quotations.length === 0) {
            throw new Error("Quotation not found");
        }

        const quotation = quotations[0];

        if (
            quotation.status !== "APPROVED" &&
            quotation.status !== "ACCEPTED"
        ) {
            throw new Error(
                "Only APPROVED or ACCEPTED quotations can be billed"
            );
        }

        // -------------------------------------------------------------
        // 2. Find fulfillment order
        // -------------------------------------------------------------

        const [fulfillmentOrders] = await connection.execute(
            `SELECT *
             FROM fulfillment_orders
             WHERE quotation_id = ?
             ORDER BY id DESC
             LIMIT 1`,
            [quotationId]
        );

        if (fulfillmentOrders.length === 0) {
            throw new Error(
                "Fulfillment order not found. Allocate fulfillment first."
            );
        }

        const fulfillmentOrder = fulfillmentOrders[0];

        // -------------------------------------------------------------
        // 3. Prevent duplicate invoice
        // -------------------------------------------------------------

        const [existingInvoices] = await connection.execute(
            `SELECT *
             FROM invoices
             WHERE order_id = ?
             LIMIT 1`,
            [fulfillmentOrder.id]
        );

        if (existingInvoices.length > 0) {
            throw new Error(
                "Billing already exists for this fulfillment order"
            );
        }

        // -------------------------------------------------------------
        // 4. Get quotation items
        // -------------------------------------------------------------

        const [items] = await connection.execute(
            `SELECT
                qi.*,
                p.name AS product_name,
                p.description AS product_description
             FROM quotation_items qi
             JOIN products p
                ON qi.product_id = p.id
             WHERE qi.quotation_id = ?`,
            [quotationId]
        );

        if (items.length === 0) {
            throw new Error("Quotation has no items");
        }

        // -------------------------------------------------------------
        // 5. Separate billing types
        // -------------------------------------------------------------

        const oneTimeItems = items.filter(
            item => item.billing_type === "ONE_TIME"
        );

        const recurringItems = items.filter(
            item => item.billing_type === "RECURRING"
        );

        // -------------------------------------------------------------
        // 6. Calculate one-time invoice
        // -------------------------------------------------------------

        let oneTimeSubtotal = 0;
        let oneTimeTax = 0;

        for (const item of oneTimeItems) {
            const amount = Number(item.line_total);

            const tax = amount * (Number(item.tax_percent || 0) / 100);

            oneTimeSubtotal += amount;
            oneTimeTax += tax;
        }

        const oneTimeTotal = oneTimeSubtotal + oneTimeTax;

        // -------------------------------------------------------------
        // 7. Create invoice if there are one-time items
        // -------------------------------------------------------------

        let invoiceId = null;
        let invoiceNumber = null;

        if (oneTimeItems.length > 0) {
            invoiceNumber = generateInvoiceNumber();

            const today = new Date();

            const dueDate = new Date(today);
            dueDate.setDate(dueDate.getDate() + 30);

            const [invoiceResult] = await connection.execute(
                `INSERT INTO invoices
                (
                    order_id,
                    invoice_number,
                    invoice_date,
                    due_date,
                    subtotal,
                    tax_amount,
                    total_amount,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, 'ISSUED')`,
                [
                    fulfillmentOrder.id,
                    invoiceNumber,
                    formatDate(today),
                    formatDate(dueDate),
                    oneTimeSubtotal,
                    oneTimeTax,
                    oneTimeTotal
                ]
            );

            invoiceId = invoiceResult.insertId;

            // ---------------------------------------------------------
            // 8. Create invoice items
            // ---------------------------------------------------------

            for (const item of oneTimeItems) {
                await connection.execute(
                    `INSERT INTO invoice_items
                    (
                        invoice_id,
                        product_id,
                        description,
                        quantity,
                        unit_price,
                        amount
                    )
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        invoiceId,
                        item.product_id,
                        item.product_name,
                        item.quantity,
                        item.unit_price,
                        item.line_total
                    ]
                );
            }
        }

        // -------------------------------------------------------------
        // 9. Create recurring billing schedules
        // -------------------------------------------------------------

        const billingSchedules = [];

        const today = new Date();

        for (const item of recurringItems) {
            if (!item.subscription_plan_id) {
                throw new Error(
                    `Subscription plan missing for product ${item.product_name}`
                );
            }

            const [plans] = await connection.execute(
                `SELECT *
                 FROM subscription_plans
                 WHERE id = ?
                   AND is_active = 1`,
                [item.subscription_plan_id]
            );

            if (plans.length === 0) {
                throw new Error(
                    `Subscription plan ${item.subscription_plan_id} not found`
                );
            }

            const plan = plans[0];

            const startDate = new Date(today);

            const nextBillingDate =
                addBillingPeriod(startDate, plan.billing_cycle);

            const amount =
                Number(plan.price) * Number(item.quantity);

            const endDate =
                addBillingPeriod(startDate, "YEARLY");

            const [scheduleResult] = await connection.execute(
                `INSERT INTO billing_schedules
                (
                    order_id,
                    subscription_plan_id,
                    start_date,
                    end_date,
                    next_billing_date,
                    quantity,
                    amount,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
                [
                    fulfillmentOrder.id,
                    plan.id,
                    formatDate(startDate),
                    formatDate(endDate),
                    formatDate(nextBillingDate),
                    item.quantity,
                    amount
                ]
            );

            billingSchedules.push({
                id: scheduleResult.insertId,
                product_id: item.product_id,
                product_name: item.product_name,
                subscription_plan_id: plan.id,
                plan_name: plan.name,
                billing_cycle: plan.billing_cycle,
                quantity: item.quantity,
                amount,
                next_billing_date: formatDate(nextBillingDate)
            });
        }

        // -------------------------------------------------------------
        // 10. Billing type
        // -------------------------------------------------------------

        let billingType = "NONE";

        if (
            oneTimeItems.length > 0 &&
            recurringItems.length > 0
        ) {
            billingType = "HYBRID";
        } else if (oneTimeItems.length > 0) {
            billingType = "ONE_TIME";
        } else if (recurringItems.length > 0) {
            billingType = "RECURRING";
        }

        // -------------------------------------------------------------
        // 11. Calculate recurring value
        // -------------------------------------------------------------

        let recurringMonthlyEquivalent = 0;

        for (const schedule of billingSchedules) {
            if (schedule.billing_cycle === "MONTHLY") {
                recurringMonthlyEquivalent += schedule.amount;
            }

            if (schedule.billing_cycle === "QUARTERLY") {
                recurringMonthlyEquivalent += schedule.amount / 3;
            }

            if (schedule.billing_cycle === "YEARLY") {
                recurringMonthlyEquivalent += schedule.amount / 12;
            }
        }

        // -------------------------------------------------------------
        // 12. Commit
        // -------------------------------------------------------------

        await connection.commit();

        return {
            quotation_id: quotationId,
            fulfillment_order_id: fulfillmentOrder.id,

            billing_type: billingType,

            invoice: invoiceId
                ? {
                    id: invoiceId,
                    invoice_number: invoiceNumber,
                    subtotal: oneTimeSubtotal,
                    tax_amount: oneTimeTax,
                    total_amount: oneTimeTotal,
                    status: "ISSUED"
                }
                : null,

            subscriptions: billingSchedules,

            summary: {
                one_time_total: Number(oneTimeTotal.toFixed(2)),
                recurring_monthly_equivalent:
                    Number(recurringMonthlyEquivalent.toFixed(2)),
                subscription_count: billingSchedules.length
            }
        };

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}


/*
|--------------------------------------------------------------------------
| GET INVOICE
|--------------------------------------------------------------------------
*/

async function getInvoiceById(invoiceId) {
    const [invoices] = await pool.execute(
        `SELECT *
         FROM invoices
         WHERE id = ?`,
        [invoiceId]
    );

    if (invoices.length === 0) {
        throw new Error("Invoice not found");
    }

    const invoice = invoices[0];

    const [items] = await pool.execute(
        `SELECT
            ii.*,
            p.name AS product_name
         FROM invoice_items ii
         JOIN products p
            ON ii.product_id = p.id
         WHERE ii.invoice_id = ?`,
        [invoiceId]
    );

    return {
        ...invoice,
        items
    };
}


/*
|--------------------------------------------------------------------------
| GET BILLING SCHEDULE
|--------------------------------------------------------------------------
*/

async function getBillingSchedule(scheduleId) {
    const [schedules] = await pool.execute(
        `SELECT
            bs.*,
            sp.name AS plan_name,
            sp.billing_cycle,
            sp.price AS plan_price
         FROM billing_schedules bs
         JOIN subscription_plans sp
            ON bs.subscription_plan_id = sp.id
         WHERE bs.id = ?`,
        [scheduleId]
    );

    if (schedules.length === 0) {
        throw new Error("Billing schedule not found");
    }

    return schedules[0];
}


/*
|--------------------------------------------------------------------------
| GET BILLING FOR ORDER
|--------------------------------------------------------------------------
*/

async function getBillingByOrder(orderId) {
    const [invoices] = await pool.execute(
        `SELECT *
         FROM invoices
         WHERE order_id = ?
         ORDER BY id DESC`,
        [orderId]
    );

    const [schedules] = await pool.execute(
        `SELECT
            bs.*,
            sp.name AS plan_name,
            sp.billing_cycle
         FROM billing_schedules bs
         JOIN subscription_plans sp
            ON bs.subscription_plan_id = sp.id
         WHERE bs.order_id = ?
         ORDER BY bs.id DESC`,
        [orderId]
    );

    return {
        order_id: orderId,
        invoices,
        billing_schedules: schedules
    };
}


/*
|--------------------------------------------------------------------------
| GENERATE RECURRING INVOICE
|--------------------------------------------------------------------------
*/

async function generateRecurringInvoice(scheduleId) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [schedules] = await connection.execute(
            `SELECT
                bs.*,
                sp.name AS plan_name,
                sp.billing_cycle
             FROM billing_schedules bs
             JOIN subscription_plans sp
                ON bs.subscription_plan_id = sp.id
             WHERE bs.id = ?
             FOR UPDATE`,
            [scheduleId]
        );

        if (schedules.length === 0) {
            throw new Error("Billing schedule not found");
        }

        const schedule = schedules[0];

        if (schedule.status !== "ACTIVE") {
            throw new Error(
                "Only ACTIVE billing schedules can generate invoices"
            );
        }

        const invoiceNumber = generateInvoiceNumber();

        const invoiceDate =
            new Date(schedule.next_billing_date);

        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + 30);

        const subtotal =
            Number(schedule.amount);

        const taxAmount = 0;

        const totalAmount =
            subtotal + taxAmount;

        const [invoiceResult] = await connection.execute(
            `INSERT INTO invoices
            (
                order_id,
                invoice_number,
                invoice_date,
                due_date,
                subtotal,
                tax_amount,
                total_amount,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 'ISSUED')`,
            [
                schedule.order_id,
                invoiceNumber,
                formatDate(invoiceDate),
                formatDate(dueDate),
                subtotal,
                taxAmount,
                totalAmount
            ]
        );

        const invoiceId = invoiceResult.insertId;

        // Move next billing date forward
        const nextBillingDate =
            addBillingPeriod(
                invoiceDate,
                schedule.billing_cycle
            );

        await connection.execute(
            `UPDATE billing_schedules
             SET next_billing_date = ?
             WHERE id = ?`,
            [
                formatDate(nextBillingDate),
                scheduleId
            ]
        );

        await connection.commit();

        return {
            invoice_id: invoiceId,
            invoice_number: invoiceNumber,
            billing_schedule_id: scheduleId,
            amount: totalAmount,
            invoice_date: formatDate(invoiceDate),
            next_billing_date: formatDate(nextBillingDate),
            status: "ISSUED"
        };

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}


module.exports = {
    createHybridBilling,
    getInvoiceById,
    getBillingSchedule,
    getBillingByOrder,
    generateRecurringInvoice
};