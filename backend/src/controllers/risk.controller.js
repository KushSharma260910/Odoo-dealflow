const engine = require("../engines/risk/risk.engine");
const { success } = require("../utils/response");
async function get(req, res, next) {
  try {
    return success(res, await engine.get(req.params.id));
  } catch (e) {
    next(e);
  }
}
async function analyze(req, res, next) {
  try {
    return success(res, await engine.analyze(req.params.id));
  } catch (e) {
    next(e);
  }
}
module.exports = { get, analyze };
