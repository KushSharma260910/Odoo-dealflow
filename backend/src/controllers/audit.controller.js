const audit = require('../models/audit.model');
const { success, failure } = require('../utils/response');
async function list(req, res, next) { try { return success(res, await audit.list(req.query)); } catch (e) { next(e); } }
async function get(req, res, next) { try { const row = await audit.findById(req.params.id); return row ? success(res, row) : failure(res, 'Audit record not found', 404); } catch (e) { next(e); } }
module.exports = { list, get };
