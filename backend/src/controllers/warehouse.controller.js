const { query } = require('../config/db');
const warehouse = require('../models/warehouse.model');
const fulfillment = require('../engines/fulfillment/fulfillment.engine');
const { success, failure } = require('../utils/response');

const required = (value, name) => { if (value === undefined || value === null || value === '') throw new Error(`${name} is required`); };
async function create(req, res, next) { try { required(req.body.name, 'name'); return success(res, await warehouse.create(req.body), 201); } catch (e) { next(e); } }
async function list(req, res, next) { try { return success(res, await warehouse.list()); } catch (e) { next(e); } }
async function get(req, res, next) { try { const row = await warehouse.findById(req.params.id); return row ? success(res, row) : failure(res, 'Warehouse not found', 404); } catch (e) { next(e); } }
async function update(req, res, next) { try { const row = await warehouse.update(req.params.id, req.body); return row ? success(res, row) : failure(res, 'Warehouse not found', 404); } catch (e) { next(e); } }
async function stock(req, res, next) { try { return success(res, await warehouse.stock(req.params.id)); } catch (e) { next(e); } }
async function updateStock(req, res, next) { try { required(req.body.product_id, 'product_id'); return success(res, await warehouse.upsertStock(req.params.id, req.body)); } catch (e) { next(e); } }
async function allocate(req, res, next) { try { required(req.body.order_id, 'order_id'); return success(res, await fulfillment.allocate(req.body.order_id, req.body.items)); } catch (e) { next(e); } }
async function createOrder(req, res, next) { try { required(req.body.quotation_id, 'quotation_id'); const result = await query('INSERT INTO orders (quotation_id, total_amount) SELECT id, total_amount FROM quotations WHERE id = ?', [req.body.quotation_id]); return success(res, { id: result.insertId }, 201); } catch (e) { next(e); } }
async function listOrders(req, res, next) { try { return success(res, await query('SELECT o.*, q.customer_id, c.name AS customer_name FROM orders o JOIN quotations q ON q.id = o.quotation_id JOIN customers c ON c.id = q.customer_id ORDER BY o.confirmed_at DESC')); } catch (e) { next(e); } }
async function getOrder(req, res, next) { try { const rows = await query('SELECT o.*, q.customer_id, c.name AS customer_name FROM orders o JOIN quotations q ON q.id = o.quotation_id JOIN customers c ON c.id = q.customer_id WHERE o.id = ?', [req.params.id]); return rows[0] ? success(res, rows[0]) : failure(res, 'Order not found', 404); } catch (e) { next(e); } }
async function fulfill(req, res, next) { try { return success(res, await fulfillment.fulfill(req.params.id, req.body)); } catch (e) { next(e); } }
async function fulfillmentStatus(req, res, next) { try { return success(res, await fulfillment.getFulfillment(req.params.id)); } catch (e) { next(e); } }
module.exports = { create, list, get, update, stock, updateStock, allocate, createOrder, listOrders, getOrder, fulfill, fulfillmentStatus };
