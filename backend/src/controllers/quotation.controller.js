const service = require("../services/quotation.service");
const { query } = require("../config/db");
const { success, failure } = require("../utils/response");
async function create(req, res, next) {
  try {
    let customerId = req.body.customer_id;
    let salesRepId = req.body.sales_rep_id || (req.user?.role === "SALES_REP" ? req.user.id : null);

    if (!customerId && req.user?.role === "CUSTOMER") {
      const customers = await query("SELECT id FROM customers WHERE email = ?", [req.user.email]);
      if (customers[0]) {
        customerId = customers[0].id;
      } else {
        const created = await query(
          "INSERT INTO customers (name, email, company_name, tier, status) VALUES (?, ?, 'Independent Customer', 'BRONZE', 'ACTIVE')",
          [req.user.name || "Customer Account", req.user.email],
        );
        customerId = created.insertId;
      }
      await query("UPDATE users SET customer_id = ? WHERE id = ?", [customerId, req.user.id]);
    }

    if (!salesRepId) {
      const reps = await query("SELECT id FROM users WHERE role = 'SALES_REP' AND status = 'ACTIVE' ORDER BY id LIMIT 1");
      salesRepId = reps[0]?.id;
    }

    if (!customerId || !salesRepId)
      return failure(res, "A customer and active sales representative are required");

    return success(
      res,
      await service.create({
        ...req.body,
        customer_id: customerId,
        sales_rep_id: salesRepId,
      }),
      201,
    );
  } catch (e) {
    next(e);
  }
}
async function list(req, res, next) {
  try {
    return success(res, await service.list(req.user));
  } catch (e) {
    next(e);
  }
}
async function get(req, res, next) {
  try {
    const row = await service.findById(req.params.id);
    return row ? success(res, row) : failure(res, "Quotation not found", 404);
  } catch (e) {
    next(e);
  }
}
async function update(req, res, next) {
  try {
    const row = await service.update(req.params.id, req.body);
    return row ? success(res, row) : failure(res, "Quotation not found", 404);
  } catch (e) {
    next(e);
  }
}
async function addItem(req, res, next) {
  try {
    if (!req.body.product_id || !req.body.quantity)
      return failure(res, "product_id and quantity are required");
    return success(res, await service.addItem(req.params.id, req.body), 201);
  } catch (e) {
    next(e);
  }
}
async function updateItem(req, res, next) {
  try {
    const row = await service.updateItem(req.params.itemId, req.body);
    return row
      ? success(res, row)
      : failure(res, "Quotation item not found", 404);
  } catch (e) {
    next(e);
  }
}
async function removeItem(req, res, next) {
  try {
    await service.removeItem(req.params.id, req.params.itemId);
    return success(res, { deleted: true });
  } catch (e) {
    next(e);
  }
}
async function submit(req, res, next) {
  try {
    const row = await service.submit(req.params.id, req.user?.id);
    return row ? success(res, row) : failure(res, "Quotation not found", 404);
  } catch (e) {
    next(e);
  }
}
module.exports = {
  create,
  list,
  get,
  update,
  addItem,
  updateItem,
  removeItem,
  submit,
};
