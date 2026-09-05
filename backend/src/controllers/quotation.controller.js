const service = require('../services/quotation.service');
const { success, failure } = require('../utils/response');
async function create(req, res, next) { try { if (!req.body.customer_id || !(req.body.sales_rep_id || req.user?.id)) return failure(res, 'customer_id and sales_rep_id are required'); return success(res, await service.create({ ...req.body, sales_rep_id: req.body.sales_rep_id || req.user.id }), 201); } catch (e) { next(e); } }
async function list(req, res, next) { try { return success(res, await service.list(req.user)); } catch (e) { next(e); } }
async function get(req, res, next) { try { const row = await service.findById(req.params.id); return row ? success(res, row) : failure(res, 'Quotation not found', 404); } catch (e) { next(e); } }
async function update(req, res, next) { try { const row = await service.update(req.params.id, req.body); return row ? success(res, row) : failure(res, 'Quotation not found', 404); } catch (e) { next(e); } }
async function addItem(req, res, next) { try { if (!req.body.product_id || !req.body.quantity) return failure(res, 'product_id and quantity are required'); return success(res, await service.addItem(req.params.id, req.body), 201); } catch (e) { next(e); } }
async function updateItem(req, res, next) { try { const row = await service.updateItem(req.params.itemId, req.body); return row ? success(res, row) : failure(res, 'Quotation item not found', 404); } catch (e) { next(e); } }
async function removeItem(req, res, next) { try { await service.removeItem(req.params.id, req.params.itemId); return success(res, { deleted: true }); } catch (e) { next(e); } }
async function submit(req, res, next) { try { const row = await service.submit(req.params.id, req.user?.id); return row ? success(res, row) : failure(res, 'Quotation not found', 404); } catch (e) { next(e); } }
module.exports = { create, list, get, update, addItem, updateItem, removeItem, submit };
