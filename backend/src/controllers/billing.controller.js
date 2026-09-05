const { query } = require('../config/db');
const invoice = require('../models/invoice.model');
const billing = require('../engines/billing/billing.engine');
const { success, failure } = require('../utils/response');
async function calculate(req, res, next) { try { if (!req.body.quotation_id) return failure(res, 'quotation_id is required'); return success(res, await billing.calculate(req.body.quotation_id)); } catch (e) { next(e); } }
async function generate(req, res, next) { try { if (!req.body.order_id) return failure(res, 'order_id is required'); return success(res, await billing.generate(req.body.order_id, req.body), 201); } catch (e) { next(e); } }
async function byQuotation(req, res, next) { try { return success(res, await invoice.byQuotation(req.params.quotationId)); } catch (e) { next(e); } }
async function customerInvoices(req, res, next) { try { if (!req.user?.customer_id) return failure(res, 'Customer authentication required', 401); return success(res, await invoice.byCustomer(req.user.customer_id)); } catch (e) { next(e); } }
async function customerInvoice(req, res, next) { try { if (!req.user?.customer_id) return failure(res, 'Customer authentication required', 401); const rows = await query('SELECT i.* FROM invoices i JOIN orders o ON o.id = i.order_id JOIN quotations q ON q.id = o.quotation_id WHERE i.id = ? AND q.customer_id = ?', [req.params.id, req.user.customer_id]); return rows[0] ? success(res, rows[0]) : failure(res, 'Invoice not found', 404); } catch (e) { next(e); } }
async function customerBilling(req, res, next) { try { if (!req.user?.customer_id) return failure(res, 'Customer authentication required', 401); return success(res, await query('SELECT bs.* FROM billing_schedules bs JOIN order_items oi ON oi.id = bs.order_item_id JOIN orders o ON o.id = oi.order_id JOIN quotations q ON q.id = o.quotation_id WHERE q.id = ? AND q.customer_id = ? ORDER BY bs.billing_date', [req.params.quotationId, req.user.customer_id])); } catch (e) { next(e); } }
module.exports = { calculate, generate, byQuotation, customerInvoices, customerInvoice, customerBilling };
