const { query } = require("../config/db");
const { success, failure } = require("../utils/response");

async function getCustomerId(req, res) {
  if (!req.user) {
    failure(res, "Authentication required", 401);
    return null;
  }
  if (req.user.customer_id) {
    return req.user.customer_id;
  }
  // Auto-link or create customer account for user
  const custs = await query("SELECT id FROM customers WHERE email = ?", [req.user.email]);
  if (custs[0]) {
    await query("UPDATE users SET customer_id = ? WHERE id = ?", [custs[0].id, req.user.id]);
    req.user.customer_id = custs[0].id;
    return custs[0].id;
  }
  const newCust = await query(
    "INSERT INTO customers (name, email, company_name, tier, status) VALUES (?, ?, ?, 'BRONZE', 'ACTIVE')",
    [req.user.name || 'Customer Account', req.user.email, 'Independent Customer']
  );
  await query("UPDATE users SET customer_id = ? WHERE id = ?", [newCust.insertId, req.user.id]);
  req.user.customer_id = newCust.insertId;
  return newCust.insertId;
}

async function quotations(req, res, next) {
  try {
    const id = await getCustomerId(req, res);
    if (!id) return;
    return success(
      res,
      await query(
        "SELECT * FROM quotations WHERE customer_id = ? ORDER BY updated_at DESC",
        [id],
      ),
    );
  } catch (e) {
    next(e);
  }
}
async function quotation(req, res, next) {
  try {
    const id = await getCustomerId(req, res);
    if (!id) return;
    const rows = await query(
      "SELECT * FROM quotations WHERE id = ? AND customer_id = ?",
      [req.params.id, id],
    );
    return rows[0]
      ? success(res, rows[0])
      : failure(res, "Quotation not found", 404);
  } catch (e) {
    next(e);
  }
}
async function negotiations(req, res, next) {
  try {
    const id = await getCustomerId(req, res);
    if (!id) return;
    const rows = await query(
      "SELECT * FROM negotiations WHERE id = ? AND customer_id = ?",
      [req.params.id, id],
    );
    if (!rows[0]) return failure(res, "Negotiation not found", 404);
    const messages = await query(
      "SELECT * FROM negotiation_messages WHERE negotiation_id = ? ORDER BY created_at",
      [req.params.id],
    );
    return success(res, { ...rows[0], messages });
  } catch (e) {
    next(e);
  }
}
async function message(req, res, next) {
  try {
    const id = await getCustomerId(req, res);
    if (!id) return;
    if (!req.body.message) return failure(res, "message is required");
    const rows = await query(
      "SELECT id FROM negotiations WHERE id = ? AND customer_id = ?",
      [req.params.id, id],
    );
    if (!rows[0]) return failure(res, "Negotiation not found", 404);
    const result = await query(
      "INSERT INTO negotiation_messages (negotiation_id, sender_user_id, message) VALUES (?, ?, ?)",
      [req.params.id, req.user.id, req.body.message],
    );
    return success(res, { id: result.insertId }, 201);
  } catch (e) {
    next(e);
  }
}
async function decision(req, res, next) {
  try {
    const id = await getCustomerId(req, res);
    if (!id) return;
    const status = req.path.endsWith("/accept") ? "CONFIRMED" : "REJECTED";
    const result = await query(
      "UPDATE quotations SET status = ?, confirmed_by = ?, confirmed_at = CURRENT_TIMESTAMP, confirmation_source = 'CUSTOMER_PORTAL' WHERE id = ? AND customer_id = ?",
      [status, req.user.id, req.params.id, id],
    );
    return result.affectedRows
      ? success(res, { status })
      : failure(res, "Quotation not found", 404);
  } catch (e) {
    next(e);
  }
}
async function createRequest(req, res, next) {
  try {
    const id = await getCustomerId(req, res);
    if (!id) return;
    const rows = await query(
      "SELECT id FROM quotations WHERE id = ? AND customer_id = ?",
      [req.params.id, id],
    );
    if (!rows[0]) return failure(res, "Quotation not found", 404);
    const negotiation = await query(
      "INSERT INTO negotiations (quotation_id, customer_id, status) VALUES (?, ?, 'OPEN')",
      [req.params.id, id],
    );
    const result = await query(
      "INSERT INTO negotiation_line_requests (negotiation_id, quotation_item_id, requested_quantity, requested_discount_percent, request_type, customer_comment) VALUES (?, ?, ?, ?, ?, ?)",
      [
        negotiation.insertId,
        req.body.quotation_item_id,
        req.body.requested_quantity || null,
        req.body.requested_discount_percent || null,
        req.body.request_type || "COMMENT",
        req.body.customer_comment || null,
      ],
    );
    return success(
      res,
      { negotiation_id: negotiation.insertId, request_id: result.insertId },
      201,
    );
  } catch (e) {
    next(e);
  }
}
async function requests(req, res, next) {
  try {
    const id = await getCustomerId(req, res);
    if (!id) return;
    return success(
      res,
      await query(
        "SELECT lr.* FROM negotiation_line_requests lr JOIN negotiations n ON n.id = lr.negotiation_id WHERE n.quotation_id = ? AND n.customer_id = ? ORDER BY lr.created_at DESC",
        [req.params.id, id],
      ),
    );
  } catch (e) {
    next(e);
  }
}

module.exports = {
  quotations,
  quotation,
  negotiations,
  message,
  decision,
  createRequest,
  requests,
};
