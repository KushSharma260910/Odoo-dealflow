const model = require('../models/user.model');
const { success, failure } = require('../utils/response');
async function list(req, res, next) { try { return success(res, await model.list()); } catch (e) { next(e); } }
async function get(req, res, next) { try { const row = await model.findById(req.params.id); return row ? success(res, row) : failure(res, 'User not found', 404); } catch (e) { next(e); } }
async function update(req, res, next) { try { const row = await model.update(req.params.id, req.body); return row ? success(res, row) : failure(res, 'User not found', 404); } catch (e) { next(e); } }
async function status(req, res, next) { try { if (!['ACTIVE', 'INACTIVE'].includes(req.body.status)) return failure(res, 'status must be ACTIVE or INACTIVE'); const row = await model.setStatus(req.params.id, req.body.status); return row ? success(res, row) : failure(res, 'User not found', 404); } catch (e) { next(e); } }
module.exports = { list, get, update, status };