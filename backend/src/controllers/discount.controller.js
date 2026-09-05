const model = require('../models/discount.model');
const engine = require('../engines/discount/discount.engine');
const { success, failure } = require('../utils/response');
async function create(req, res, next) { try { return success(res, await model.create(req.body), 201); } catch (e) { next(e); } }
async function list(req, res, next) { try { return success(res, await model.list()); } catch (e) { next(e); } }
async function update(req, res, next) { try { const row = await model.update(req.params.id, req.body); return row ? success(res, row) : failure(res, 'Discount rule not found', 404); } catch (e) { next(e); } }
async function evaluate(req, res, next) { try { return success(res, await engine.evaluate(req.params.quotationId)); } catch (e) { next(e); } }
module.exports = { create, list, update, evaluate };
