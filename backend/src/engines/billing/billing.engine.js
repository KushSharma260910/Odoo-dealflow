const { pool } = require("../../config/db");
const { createAuditLog } = require("../audit/audit.engine");


// ======================================================
// BILLING HELPERS
// ======================================================

function addBillingPeriod(date, cycle) {

    const result = new Date(date);

    if (cycle === "MONTHLY") {

        result.setMonth(
            result.getMonth() + 1
        );

    } else if (cycle === "QUARTERLY") {

        result.setMonth(
            result.getMonth() + 3
        );

    } else if (cycle === "YEARLY") {

        result.setFullYear(
            result.getFullYear() + 1
        );
    }

    return result;
}


function formatDate(date) {

    return date
        .toISOString()
        .split("T")[0];
}


function generateInvoiceNumber() {

    return `INV-${Date.now()}`;
}


/*
====================================================
CREATE HYBRID BILLING
====================================================
*/

async function createHybridBilling(quotationId) {

    const connection =
        await pool.getConnection();

    try {

        await connection.beginTransaction();


        // ==================================================
        // 1. GET QUOTATION
        // ==================================================

        const [quotations] =
            await connection.execute(
                `SELECT *
                 FROM quotations
                 WHERE id = ?`,
                [quotationId]
            );


        if (quotations.length === 0) {

            throw new Error(
                "Quotation not found"
            );
        }


        const quotation =
            quotations[0];


        if (
            quotation.status !== "APPROVED" &&
            quotation.status !== "ACCEPTED"
        ) {

            throw new Error(
                "Quotation must be APPROVED or ACCEPTED before billing"
            );
        }


        // ==================================================
        // 2. GET FULFILLMENT ORDER
        // ==================================================

        const [fulfillmentOrders] =
            await connection.execute(
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


        const fulfillmentOrder =
            fulfillmentOrders[0];


        // ==================================================
        // 3. PREVENT DUPLICATE INVOICE
        // ==================================================

        const [existingInvoices] =
            await connection.execute(
                `SELECT *
                 FROM invoices
                 WHERE order_id = ?`,
                [fulfillmentOrder.id]
            );


        if (existingInvoices.length > 0) {

            throw new Error(
                "Billing already exists for this fulfillment order"
            );
        }


        // ==================================================
        // 4. GET QUOTATION ITEMS
        // ==================================================

        const [items] =
            await connection.execute(
                `SELECT
                    qi.*,
                    p.name AS product_name,
                    sp.name AS subscription_plan_name,
                    sp.billing_cycle,
                    sp.price AS subscription_price
                 FROM quotation_items qi
                 JOIN products p
                    ON qi.product_id = p.id
                 LEFT JOIN subscription_plans sp
                    ON qi.subscription_plan_id = sp.id
                 WHERE qi.quotation_id = ?`,
                [quotationId]
            );


        if (items.length === 0) {

            throw new Error(
                "Quotation has no items"
            );
        }


        // ==================================================
        // 5. SEPARATE BILLING TYPES
        // ==================================================

        const oneTimeItems =
            items.filter(
                item =>
                    item.billing_type === "ONE_TIME"
            );


        const recurringItems =
            items.filter(
                item =>
                    item.billing_type === "RECURRING"
            );


        // ==================================================
        // ONE-TIME BILLING
        // ==================================================

        let oneTimeSubtotal = 0;
        let oneTimeTax = 0;


        for (const item of oneTimeItems) {

            const grossAmount =
                Number(item.unit_price) *
                Number(item.quantity);


            const discountAmount =
                grossAmount *
                (
                    Number(item.discount_percent) /
                    100
                );


            const netAmount =
                grossAmount -
                discountAmount;


            const taxAmount =
                netAmount *
                (
                    Number(item.tax_percent) /
                    100
                );


            oneTimeSubtotal +=
                netAmount;


            oneTimeTax +=
                taxAmount;
        }


        let invoice = null;


        // ==================================================
        // 6. CREATE ONE-TIME INVOICE
        // ==================================================

        if (oneTimeItems.length > 0) {

            const invoiceNumber =
                generateInvoiceNumber();


            const invoiceDate =
                new Date();


            const dueDate =
                new Date();


            dueDate.setDate(
                dueDate.getDate() + 30
            );


            const totalAmount =
                oneTimeSubtotal +
                oneTimeTax;


            const [invoiceResult] =
                await connection.execute(
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
                        formatDate(invoiceDate),
                        formatDate(dueDate),
                        oneTimeSubtotal,
                        oneTimeTax,
                        totalAmount
                    ]
                );


            const invoiceId =
                invoiceResult.insertId;


            // ==================================================
            // 7. CREATE INVOICE ITEMS
            // ==================================================

            for (const item of oneTimeItems) {

                const grossAmount =
                    Number(item.unit_price) *
                    Number(item.quantity);


                const discountAmount =
                    grossAmount *
                    (
                        Number(item.discount_percent) /
                        100
                    );


                const amount =
                    grossAmount -
                    discountAmount;


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
                        amount
                    ]
                );
            }


            invoice = {

                id:
                    invoiceId,

                invoice_number:
                    invoiceNumber,

                subtotal:
                    oneTimeSubtotal,

                tax_amount:
                    oneTimeTax,

                total_amount:
                    totalAmount
            };
        }


        // ==================================================
        // RECURRING BILLING
        // ==================================================

        const subscriptions = [];


        for (const item of recurringItems) {

            if (!item.subscription_plan_id) {

                throw new Error(
                    `Recurring item ${item.product_name} requires a subscription plan`
                );
            }


            const startDate =
                new Date();


            const nextBillingDate =
                addBillingPeriod(
                    startDate,
                    item.billing_cycle
                );


            const amount =
                Number(item.subscription_price) *
                Number(item.quantity);


            const [scheduleResult] =
                await connection.execute(
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

                        item.subscription_plan_id,

                        formatDate(startDate),

                        formatDate(
                            addBillingPeriod(
                                startDate,
                                "YEARLY"
                            )
                        ),

                        formatDate(
                            nextBillingDate
                        ),

                        item.quantity,

                        amount
                    ]
                );


            subscriptions.push({

                schedule_id:
                    scheduleResult.insertId,

                product_id:
                    item.product_id,

                product_name:
                    item.product_name,

                subscription_plan_id:
                    item.subscription_plan_id,

                subscription_plan:
                    item.subscription_plan_name,

                billing_cycle:
                    item.billing_cycle,

                quantity:
                    item.quantity,

                amount
            });
        }


        // ==================================================
        // 8. COMMIT TRANSACTION
        // ==================================================

        await connection.commit();


        // ==================================================
        // 9. AUDIT BILLING CREATION
        // ==================================================

        await createAuditLog({

            userId:
                null,

            entityType:
                "BILLING",

            entityId:
                fulfillmentOrder.id,

            action:
                "BILLING_CREATED",

            oldValue:
                null,

            newValue: {

                quotation_id:
                    quotationId,

                fulfillment_order_id:
                    fulfillmentOrder.id,

                billing_type:
                    oneTimeItems.length > 0 &&
                    recurringItems.length > 0
                        ? "HYBRID"
                        : oneTimeItems.length > 0
                            ? "ONE_TIME"
                            : "RECURRING",

                invoice_id:
                    invoice
                        ? invoice.id
                        : null,

                subscription_count:
                    subscriptions.length,

                one_time_total:
                    Number(
                        (
                            oneTimeSubtotal +
                            oneTimeTax
                        ).toFixed(2)
                    )
            },

            reason:
                "Billing successfully created from approved quotation"
        });


        // ==================================================
        // 10. RETURN RESPONSE
        // ==================================================

        return {

            quotation_id:
                quotationId,

            fulfillment_order_id:
                fulfillmentOrder.id,

            billing_type:

                oneTimeItems.length > 0 &&
                recurringItems.length > 0

                    ? "HYBRID"

                    : oneTimeItems.length > 0

                        ? "ONE_TIME"

                        : "RECURRING",


            invoice,

            subscriptions,


            summary: {

                one_time_subtotal:
                    Number(
                        oneTimeSubtotal.toFixed(2)
                    ),


                one_time_tax:
                    Number(
                        oneTimeTax.toFixed(2)
                    ),


                one_time_total:
                    Number(
                        (
                            oneTimeSubtotal +
                            oneTimeTax
                        ).toFixed(2)
                    ),


                recurring_monthly_equivalent:
                    Number(

                        subscriptions.reduce(
                            (
                                total,
                                subscription
                            ) => {

                                if (
                                    subscription.billing_cycle ===
                                    "MONTHLY"
                                ) {

                                    return (
                                        total +
                                        subscription.amount
                                    );
                                }


                                if (
                                    subscription.billing_cycle ===
                                    "QUARTERLY"
                                ) {

                                    return (
                                        total +
                                        subscription.amount / 3
                                    );
                                }


                                if (
                                    subscription.billing_cycle ===
                                    "YEARLY"
                                ) {

                                    return (
                                        total +
                                        subscription.amount / 12
                                    );
                                }


                                return total;

                            },
                            0
                        ).toFixed(2)
                    )
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
====================================================
GET INVOICE
====================================================
*/

async function getInvoiceById(invoiceId) {

    const [invoices] =
        await pool.execute(
            `SELECT *
             FROM invoices
             WHERE id = ?`,
            [invoiceId]
        );


    if (invoices.length === 0) {

        throw new Error(
            "Invoice not found"
        );
    }


    const invoice =
        invoices[0];


    const [items] =
        await pool.execute(
            `SELECT
                ii.*,
                p.name AS product_name
             FROM invoice_items ii
             LEFT JOIN products p
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
====================================================
GET BILLING SCHEDULE
====================================================
*/

async function getBillingSchedule(
    scheduleId
) {

    const [rows] =
        await pool.execute(
            `SELECT
                bs.*,
                sp.name AS subscription_plan,
                sp.billing_cycle,
                sp.price AS plan_price
             FROM billing_schedules bs
             JOIN subscription_plans sp
                ON bs.subscription_plan_id = sp.id
             WHERE bs.id = ?`,
            [scheduleId]
        );


    if (rows.length === 0) {

        throw new Error(
            "Billing schedule not found"
        );
    }


    return rows[0];
}


/*
====================================================
GET BILLING BY ORDER
====================================================
*/

async function getBillingByOrder(
    orderId
) {

    const [invoices] =
        await pool.execute(
            `SELECT *
             FROM invoices
             WHERE order_id = ?
             ORDER BY id DESC`,
            [orderId]
        );


    const [schedules] =
        await pool.execute(
            `SELECT
                bs.*,
                sp.name AS subscription_plan,
                sp.billing_cycle
             FROM billing_schedules bs
             JOIN subscription_plans sp
                ON bs.subscription_plan_id = sp.id
             WHERE bs.order_id = ?
             ORDER BY bs.id DESC`,
            [orderId]
        );


    return {

        invoices,

        subscriptions:
            schedules
    };
}


/*
====================================================
GENERATE RECURRING INVOICE
====================================================
*/

async function generateRecurringInvoice(
    scheduleId
) {

    const connection =
        await pool.getConnection();


    try {

        await connection.beginTransaction();


        // ==================================================
        // GET BILLING SCHEDULE
        // ==================================================

        const [schedules] =
            await connection.execute(
                `SELECT
                    bs.*,
                    sp.name AS subscription_plan,
                    sp.billing_cycle
                 FROM billing_schedules bs
                 JOIN subscription_plans sp
                    ON bs.subscription_plan_id = sp.id
                 WHERE bs.id = ?
                 FOR UPDATE`,
                [scheduleId]
            );


        if (schedules.length === 0) {

            throw new Error(
                "Billing schedule not found"
            );
        }


        const schedule =
            schedules[0];


        if (schedule.status !== "ACTIVE") {

            throw new Error(
                "Billing schedule is not active"
            );
        }


        // ==================================================
        // GENERATE INVOICE
        // ==================================================

        const invoiceNumber =
            generateInvoiceNumber();


        const invoiceDate =
            new Date();


        const dueDate =
            new Date();


        dueDate.setDate(
            dueDate.getDate() + 30
        );


        const subtotal =
            Number(schedule.amount);


        const [invoiceResult] =
            await connection.execute(
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
                VALUES (?, ?, ?, ?, ?, 0, ?, 'ISSUED')`,
                [
                    schedule.order_id,

                    invoiceNumber,

                    formatDate(invoiceDate),

                    formatDate(dueDate),

                    subtotal,

                    subtotal
                ]
            );


        // ==================================================
        // UPDATE NEXT BILLING DATE
        // ==================================================

        const nextBillingDate =
            addBillingPeriod(
                schedule.next_billing_date,
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


        // ==================================================
        // COMMIT
        // ==================================================

        await connection.commit();


        // ==================================================
        // AUDIT RECURRING INVOICE
        // ==================================================

        await createAuditLog({

            userId:
                null,

            entityType:
                "BILLING",

            entityId:
                invoiceResult.insertId,

            action:
                "RECURRING_INVOICE_GENERATED",

            oldValue: {

                schedule_id:
                    scheduleId,

                next_billing_date:
                    formatDate(
                        schedule.next_billing_date
                    )
            },

            newValue: {

                invoice_id:
                    invoiceResult.insertId,

                invoice_number:
                    invoiceNumber,

                schedule_id:
                    scheduleId,

                amount:
                    subtotal,

                next_billing_date:
                    formatDate(
                        nextBillingDate
                    )
            },

            reason:
                "Recurring billing invoice generated successfully"
        });


        return {

            invoice_id:
                invoiceResult.insertId,

            invoice_number:
                invoiceNumber,

            schedule_id:
                scheduleId,

            amount:
                subtotal,

            next_billing_date:
                formatDate(
                    nextBillingDate
                )
        };


    } catch (error) {

        await connection.rollback();

        throw error;

    } finally {

        connection.release();
    }
}


// ======================================================
// EXPORTS
// ======================================================

module.exports = {

    createHybridBilling,

    getInvoiceById,

    getBillingSchedule,

    getBillingByOrder,

    generateRecurringInvoice
};