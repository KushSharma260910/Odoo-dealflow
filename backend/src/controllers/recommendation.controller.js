const engine = require("../engines/recommendation/recommendation.engine");
const { success } = require("../utils/response");
async function quotation(req, res, next) {
  try {
    return success(res, await engine.forQuotation(req.params.quotationId));
  } catch (e) {
    next(e);
  }
}
async function product(req, res, next) {
  try {
    return success(res, await engine.forProduct(req.params.id));
  } catch (e) {
    next(e);
  }
}
module.exports = { quotation, product };
