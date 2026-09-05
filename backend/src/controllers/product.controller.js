const service = require('../services/product.service');
const { success, failure } = require('../utils/response');
async function create(req, res, next) { try { for (const field of ['category_id', 'name', 'sku', 'base_price', 'cost_price']) if (req.body[field] === undefined) return failure(res, `${field} is required`); return success(res, await service.create(req.body), 201); } catch (e) { next(e); } }
async function list(req, res, next) { try { return success(res, await service.list(req.query)); } catch (e) { next(e); } }
async function get(req, res, next) { try { const row = await service.findById(req.params.id); return row ? success(res, row) : failure(res, 'Product not found', 404); } catch (e) { next(e); } }
async function update(req, res, next) { try { const row = await service.update(req.params.id, req.body); return row ? success(res, row) : failure(res, 'Product not found', 404); } catch (e) { next(e); } }
async function remove(req, res, next) { try { return success(res, { deleted: await service.remove(req.params.id) }); } catch (e) { next(e); } }
module.exports = { create, list, get, update, remove };
