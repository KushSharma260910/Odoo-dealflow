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
async function getOrCreateNegotiation(paramId, customerId) {
  let rows = await query(
    "SELECT * FROM negotiations WHERE (id = ? OR quotation_id = ?) AND customer_id = ?",
    [paramId, paramId, customerId]
  );
  if (rows[0]) return rows[0];

  const quotes = await query(
    "SELECT id, total_amount, subtotal, discount_amount FROM quotations WHERE id = ? AND customer_id = ?",
    [paramId, customerId]
  );
  if (!quotes[0]) return null;

  const subtotal = Number(quotes[0].subtotal || 0);
  const discountAmount = Number(quotes[0].discount_amount || 0);
  const proposedDiscount = subtotal ? Math.round((discountAmount * 100 / subtotal) * 100) / 100 : 0;

  const result = await query(
    "INSERT INTO negotiations (quotation_id, customer_id, status, proposed_discount_percent, proposed_total) VALUES (?, ?, 'OPEN', ?, ?)",
    [quotes[0].id, customerId, proposedDiscount, quotes[0].total_amount]
  );

  const created = await query("SELECT * FROM negotiations WHERE id = ?", [result.insertId]);
  return created[0] || null;
}

async function negotiations(req, res, next) {
  try {
    const customerId = await getCustomerId(req, res);
    if (!customerId) return;

    const neg = await getOrCreateNegotiation(req.params.id, customerId);
    if (!neg) return failure(res, "Negotiation or Quotation not found", 404);

    const messages = await query(
      "SELECT nm.*, u.name AS sender_name, u.role AS sender_role FROM negotiation_messages nm JOIN users u ON u.id = nm.sender_user_id WHERE nm.negotiation_id = ? ORDER BY nm.created_at",
      [neg.id]
    );

    return success(res, { ...neg, messages });
  } catch (e) {
    next(e);
  }
}

async function message(req, res, next) {
  try {
    const customerId = await getCustomerId(req, res);
    if (!customerId) return;
    if (!req.body.message) return failure(res, "message is required");

    const neg = await getOrCreateNegotiation(req.params.id, customerId);
    if (!neg) return failure(res, "Negotiation or Quotation not found", 404);

    const result = await query(
      "INSERT INTO negotiation_messages (negotiation_id, sender_user_id, message) VALUES (?, ?, ?)",
      [neg.id, req.user.id, req.body.message]
    );

    await query("UPDATE negotiations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", [neg.id]);

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
