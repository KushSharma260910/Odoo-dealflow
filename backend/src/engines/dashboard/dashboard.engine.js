const { pool } = require("../../config/db");

/*
|--------------------------------------------------------------------------
| DASHBOARD OVERVIEW
|--------------------------------------------------------------------------
*/

async function getOverview() {
    const [[dealStats]] = await pool.query(`
        SELECT
            COUNT(*) AS total_deals,
            SUM(status = 'PENDING_APPROVAL') AS pending_approvals,
            SUM(status = 'APPROVED') AS approved_deals,
            SUM(status = 'REJECTED') AS rejected_deals,
            SUM(status = 'NEGOTIATION') AS negotiations,
            SUM(risk_level = 'HIGH') AS high_risk_deals,
            SUM(risk_level = 'CRITICAL') AS critical_deals,
            COALESCE(SUM(total_amount), 0) AS quotation_value,
            COALESCE(SUM(discount_amount), 0) AS discount_given
        FROM quotations
    `);

    const [[fulfillmentStats]] = await pool.query(`
        SELECT
            COUNT(*) AS fulfillment_orders,
            SUM(status = 'BACKORDER') AS backorders
        FROM fulfillment_orders
    `);

    const [[revenueStats]] = await pool.query(`
        SELECT
            COALESCE(SUM(total_amount), 0) AS total_revenue
        FROM invoices
        WHERE status IN ('ISSUED', 'PAID')
    `);

    return {
        total_deals: Number(dealStats.total_deals || 0),
        pending_approvals: Number(dealStats.pending_approvals || 0),
        approved_deals: Number(dealStats.approved_deals || 0),
        rejected_deals: Number(dealStats.rejected_deals || 0),
        negotiations: Number(dealStats.negotiations || 0),
        high_risk_deals: Number(dealStats.high_risk_deals || 0),
        critical_deals: Number(dealStats.critical_deals || 0),

        quotation_value: Number(dealStats.quotation_value || 0),
        total_revenue: Number(revenueStats.total_revenue || 0),
        discount_given: Number(dealStats.discount_given || 0),

        fulfillment_orders: Number(
            fulfillmentStats.fulfillment_orders || 0
        ),

        backorders: Number(
            fulfillmentStats.backorders || 0
        )
    };
}


/*
|--------------------------------------------------------------------------
| RISK DASHBOARD
|--------------------------------------------------------------------------
*/

async function getRiskDashboard() {

    const [[distribution]] = await pool.query(`
        SELECT
            SUM(risk_level = 'LOW') AS low,
            SUM(risk_level = 'MEDIUM') AS medium,
            SUM(risk_level = 'HIGH') AS high,
            SUM(risk_level = 'CRITICAL') AS critical
        FROM quotations
        WHERE risk_level IS NOT NULL
    `);

    const [topRiskDeals] = await pool.query(`
        SELECT
            id,
            quotation_number,
            customer_id,
            status,
            risk_score,
            risk_level,
            total_amount,
            discount_percent
        FROM quotations
        WHERE risk_level IN ('HIGH', 'CRITICAL')
        ORDER BY risk_score DESC
        LIMIT 10
    `);

    const [[averageRisk]] = await pool.query(`
        SELECT
            COALESCE(AVG(risk_score), 0) AS average_risk_score
        FROM quotations
        WHERE risk_score IS NOT NULL
    `);

    return {
        distribution: {
            low: Number(distribution.low || 0),
            medium: Number(distribution.medium || 0),
            high: Number(distribution.high || 0),
            critical: Number(distribution.critical || 0)
        },

        average_risk_score: Number(
            Number(averageRisk.average_risk_score || 0).toFixed(2)
        ),

        top_risk_deals: topRiskDeals.map(deal => ({
            id: deal.id,
            quotation_number: deal.quotation_number,
            customer_id: deal.customer_id,
            status: deal.status,
            risk_score: Number(deal.risk_score || 0),
            risk_level: deal.risk_level,
            total_amount: Number(deal.total_amount || 0),
            discount_percent: Number(deal.discount_percent || 0)
        }))
    };
}


/*
|--------------------------------------------------------------------------
| APPROVAL DASHBOARD
|--------------------------------------------------------------------------
*/

async function getApprovalDashboard() {

    const [[stats]] = await pool.query(`
        SELECT
            COUNT(*) AS total_approvals,
            SUM(status = 'PENDING') AS pending,
            SUM(status = 'APPROVED') AS approved,
            SUM(status = 'REJECTED') AS rejected,
            SUM(approval_level = 'SALES_MANAGER') AS manager_approvals,
            SUM(approval_level = 'FINANCE') AS finance_approvals
        FROM approvals
    `);

    const [pendingApprovals] = await pool.query(`
        SELECT
            a.id,
            a.quotation_id,
            a.approver_id,
            a.approval_level,
            a.status,
            a.reason,
            a.created_at,
            q.quotation_number,
            q.risk_score,
            q.risk_level,
            q.total_amount
        FROM approvals a
        JOIN quotations q
            ON q.id = a.quotation_id
        WHERE a.status = 'PENDING'
        ORDER BY a.created_at ASC
        LIMIT 20
    `);

    return {
        statistics: {
            total: Number(stats.total_approvals || 0),
            pending: Number(stats.pending || 0),
            approved: Number(stats.approved || 0),
            rejected: Number(stats.rejected || 0),
            manager_approvals: Number(stats.manager_approvals || 0),
            finance_approvals: Number(stats.finance_approvals || 0)
        },

        pending_approvals: pendingApprovals.map(item => ({
            id: item.id,
            quotation_id: item.quotation_id,
            quotation_number: item.quotation_number,
            approver_id: item.approver_id,
            approval_level: item.approval_level,
            status: item.status,
            reason: item.reason,
            risk_score: Number(item.risk_score || 0),
            risk_level: item.risk_level,
            total_amount: Number(item.total_amount || 0),
            created_at: item.created_at
        }))
    };
}


/*
|--------------------------------------------------------------------------
| FULFILLMENT DASHBOARD
|--------------------------------------------------------------------------
*/

async function getFulfillmentDashboard() {

    const [[stats]] = await pool.query(`
        SELECT
            COUNT(*) AS total_orders,
            SUM(status = 'PENDING') AS pending,
            SUM(status = 'ALLOCATED') AS allocated,
            SUM(status = 'PARTIAL') AS partial,
            SUM(status = 'BACKORDER') AS backorder,
            SUM(status = 'COMPLETED') AS completed
        FROM fulfillment_orders
    `);

    const [[backorderStats]] = await pool.query(`
        SELECT
            COUNT(*) AS backorder_count,
            COALESCE(SUM(quantity), 0) AS backorder_quantity
        FROM backorders
        WHERE status = 'PENDING'
    `);

    const [warehouseAllocation] = await pool.query(`
        SELECT
            w.id AS warehouse_id,
            w.name AS warehouse_name,
            w.location,
            COALESCE(SUM(fi.quantity_allocated), 0) AS allocated_quantity
        FROM warehouses w
        LEFT JOIN fulfillment_items fi
            ON fi.warehouse_id = w.id
        GROUP BY w.id, w.name, w.location
        ORDER BY allocated_quantity DESC
    `);

    return {
        statistics: {
            total_orders: Number(stats.total_orders || 0),
            pending: Number(stats.pending || 0),
            allocated: Number(stats.allocated || 0),
            partial: Number(stats.partial || 0),
            backorder: Number(stats.backorder || 0),
            completed: Number(stats.completed || 0)
        },

        backorders: {
            count: Number(backorderStats.backorder_count || 0),
            quantity: Number(backorderStats.backorder_quantity || 0)
        },

        warehouse_allocation: warehouseAllocation.map(item => ({
            warehouse_id: item.warehouse_id,
            warehouse_name: item.warehouse_name,
            location: item.location,
            allocated_quantity: Number(item.allocated_quantity || 0)
        }))
    };
}


/*
|--------------------------------------------------------------------------
| REVENUE DASHBOARD
|--------------------------------------------------------------------------
*/

async function getRevenueDashboard() {

    const [[invoiceStats]] = await pool.query(`
        SELECT
            COUNT(*) AS total_invoices,
            COALESCE(SUM(total_amount), 0) AS total_revenue,
            COALESCE(SUM(status = 'PAID'), 0) AS paid_invoices,
            COALESCE(SUM(status = 'ISSUED'), 0) AS issued_invoices
        FROM invoices
    `);

    const [recentInvoices] = await pool.query(`
        SELECT
            id,
            invoice_number,
            invoice_date,
            due_date,
            subtotal,
            tax_amount,
            total_amount,
            status
        FROM invoices
        ORDER BY invoice_date DESC, id DESC
        LIMIT 10
    `);

    return {
        total_invoices: Number(invoiceStats.total_invoices || 0),
        total_revenue: Number(invoiceStats.total_revenue || 0),
        paid_invoices: Number(invoiceStats.paid_invoices || 0),
        issued_invoices: Number(invoiceStats.issued_invoices || 0),

        recent_invoices: recentInvoices.map(invoice => ({
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            invoice_date: invoice.invoice_date,
            due_date: invoice.due_date,
            subtotal: Number(invoice.subtotal || 0),
            tax_amount: Number(invoice.tax_amount || 0),
            total_amount: Number(invoice.total_amount || 0),
            status: invoice.status
        }))
    };
}


module.exports = {
    getOverview,
    getRiskDashboard,
    getApprovalDashboard,
    getFulfillmentDashboard,
    getRevenueDashboard
};