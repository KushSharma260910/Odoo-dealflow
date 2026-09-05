const negotiation = require('../models/negotiation.model');
const { success, failure } = require('../utils/response');
async function list(req, res, next) { try { return success(res, await negotiation.list(req.user)); } catch (e) { next(e); } }
async function get(req, res, next) { try { const row = await negotiation.findById(req.params.id); return row ? success(res, row) : failure(res, 'Negotiation not found', 404); } catch (e) { next(e); } }
async function message(req, res, next) { try { if (!req.body.message || !req.user?.id) return failure(res, 'message and authenticated user are required'); return success(res, await negotiation.addMessage(req.params.id, req.user.id, req.body.message), 201); } catch (e) { next(e); } }
async function respond(req, res, next) { try { if (!['ACCEPTED', 'REJECTED', 'CLOSED', 'IN_REVIEW'].includes(req.body.status)) return failure(res, 'Invalid negotiation status'); return success(res, await negotiation.respond(req.params.id, req.body.status, req.body)); } catch (e) { next(e); } }
module.exports = { list, get, message, respond };
