const model = require("../models/approval.model");
const engine = require("../engines/approval/approval.engine");
const rules = require("../engines/approval/approval.rules");
const { success, failure } = require("../utils/response");
async function list(req, res, next) {
  try {
    return success(res, await model.list(req.query));
  } catch (e) {
    next(e);
  }
}
async function get(req, res, next) {
  try {
    const row = await model.findById(req.params.id);
    return row ? success(res, row) : failure(res, "Approval not found", 404);
  } catch (e) {
    next(e);
  }
}
async function approve(req, res, next) {
  try {
    return success(
      res,
      await engine.decide(
        req.params.id,
        "APPROVED",
        req.user?.id,
        req.body.reason,
      ),
    );
  } catch (e) {
    next(e);
  }
}
async function reject(req, res, next) {
  try {
    return success(
      res,
      await engine.decide(
        req.params.id,
        "REJECTED",
        req.user?.id,
        req.body.reason,
      ),
    );
  } catch (e) {
    next(e);
  }
}
async function createRule(req, res, next) {
  try {
    return success(res, await model.createRule(req.body), 201);
  } catch (e) {
    next(e);
  }
}
async function rulesList(req, res, next) {
  try {
    return success(res, await model.rules());
  } catch (e) {
    next(e);
  }
}
module.exports = {
  list,
  get,
  approve,
  reject,
  createRule,
  rulesList,
  validate: rules.validateDecision,
};
