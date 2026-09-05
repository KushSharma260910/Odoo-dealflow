const { query } = require("../config/db");
const invoice = require("../models/invoice.model");
const billing = require("../engines/billing/billing.engine");
const { success, failure } = require("../utils/response");

async function getCustomerId(req, res) {
  if (!req.user) return null;
  if (req.user.customer_id) return req.user.customer_id;
  const rows = await query("SELECT id FROM customers WHERE email = ?", [req.user.email]);
  if (!rows[0]) return null;
  await query("UPDATE users SET customer_id = ? WHERE id = ?", [rows[0].id, req.user.id]);
  req.user.customer_id = rows[0].id;
  return rows[0].id;
}
async function calculate(req, res, next) {
  try {
    if (!req.body.quotation_id) return failure(res, "quotation_id is required");
    return success(res, await billing.calculate(req.body.quotation_id));
  } catch (e) {
    next(e);
  }
}
async function generate(req, res, next) {
  try {
    if (!req.body.order_id) return failure(res, "order_id is required");
    return success(
      res,
      await billing.generate(req.body.order_id, req.body),
      201,
    );
  } catch (e) {
    next(e);
  }
}
async function byQuotation(req, res, next) {
  try {
    return success(res, await invoice.byQuotation(req.params.quotationId));
  } catch (e) {
    next(e);
  }
}
async function customerInvoices(req, res, next) {
  try {
    if (!req.user) return failure(res, "Authentication required", 401);
    if (['ADMIN', 'FINANCE', 'SALES_MANAGER', 'OPERATIONS', 'SALES_REP'].includes(req.user.role)) {
      return success(res, await invoice.listAll());
    }
    const customerId = await getCustomerId(req, res);
    if (!customerId) return failure(res, "Customer account not found", 404);
    return success(res, await invoice.byCustomer(customerId));
  } catch (e) {
    next(e);
  }
}
async function customerInvoice(req, res, next) {
  try {
    if (!req.user) return failure(res, "Authentication required", 401);
    const customerId = await getCustomerId(req, res);
    if (!customerId) return failure(res, "Customer account not found", 404);
    const rows = await query(
      "SELECT i.* FROM invoices i JOIN orders o ON o.id = i.order_id JOIN quotations q ON q.id = o.quotation_id WHERE i.id = ? AND q.customer_id = ?",
      [req.params.id, customerId],
    );
    return rows[0]
      ? success(res, rows[0])
      : failure(res, "Invoice not found", 404);
  } catch (e) {
    next(e);
  }
}
async function customerBilling(req, res, next) {
  try {
    if (!req.user) return failure(res, "Authentication required", 401);
    const customerId = await getCustomerId(req, res);
    if (!customerId) return failure(res, "Customer account not found", 404);
    return success(
      res,
      await query(
        "SELECT bs.* FROM billing_schedules bs JOIN order_items oi ON oi.id = bs.order_item_id JOIN orders o ON o.id = oi.order_id JOIN quotations q ON q.id = o.quotation_id WHERE q.id = ? AND q.customer_id = ? ORDER BY bs.billing_date",
        [req.params.quotationId, customerId],
      ),
    );
  } catch (e) {
    next(e);
  }
}
module.exports = {
  calculate,
  generate,
  byQuotation,
  customerInvoices,
  customerInvoice,
  customerBilling,
};
