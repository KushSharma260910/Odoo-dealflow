const { query } = require("../../config/db");
const model = require("../../models/approval.model");

async function createForQuotation(quotationId) {
  const quotes = await query(
    "SELECT id, risk_score, risk_level, discount_amount, subtotal, approval_required FROM quotations WHERE id = ?",
    [quotationId],
  );
  const quote = quotes[0];
  if (!quote) throw new Error("Quotation not found");

  const score = Number(quote.risk_score || 0);
  const level = quote.risk_level || (score >= 80 ? "CRITICAL" : score >= 60 ? "HIGH" : score >= 30 ? "MEDIUM" : "LOW");

  // Determine required roles based on risk score and risk level:
  // CRITICAL (score >= 80): ADMIN
  // HIGH (score >= 60): SALES_MANAGER (Level 1) & FINANCE (Level 2)
  // MEDIUM (score >= 30): SALES_REP (Level 1)
  // LOW (score < 30): SALES_MANAGER (if discount rules require approval)

  const rolesToCreate = [];
  if (level === "CRITICAL" || score >= 80) {
    rolesToCreate.push({ level: 1, role: "ADMIN" });
  } else if (level === "HIGH" || score >= 60) {
    rolesToCreate.push({ level: 1, role: "SALES_MANAGER" });
    rolesToCreate.push({ level: 2, role: "FINANCE" });
  } else if (level === "MEDIUM" || score >= 30) {
    rolesToCreate.push({ level: 1, role: "SALES_REP" });
  } else if (quote.approval_required) {
    rolesToCreate.push({ level: 1, role: "SALES_MANAGER" });
  }

  // Clear existing PENDING approvals for this quotation before re-creating
  await query("DELETE FROM approvals WHERE quotation_id = ? AND status = 'PENDING'", [quotationId]);

  if (rolesToCreate.length > 0) {
    for (const item of rolesToCreate) {
      await query(
        "INSERT INTO approvals (quotation_id, approval_level, required_role, status) VALUES (?, ?, ?, 'PENDING')",
        [quotationId, item.level, item.role],
      );
    }
    await query(
      "UPDATE quotations SET approval_required = TRUE, status = 'PENDING_APPROVAL' WHERE id = ?",
      [quotationId],
    );
  }

  return model.list({ quotation_id: quotationId });
}

async function decide(id, status, userId, reason) {
  const approval = await model.findById(id);
  if (!approval) throw new Error("Approval not found");

  const result = await model.decide(id, status, userId, reason);

  if (status === "REJECTED") {
    await query("UPDATE quotations SET status = 'REJECTED', approval_required = FALSE WHERE id = ?", [
      approval.quotation_id,
    ]);
    await query(
      "INSERT INTO quotation_status_history (quotation_id, old_status, new_status, changed_by, reason) VALUES (?, 'PENDING_APPROVAL', 'REJECTED', ?, ?)",
      [approval.quotation_id, userId || null, reason || 'Rejected by ' + (approval.required_role || 'approver')],
    );
  }

  if (status === "APPROVED") {
    const pending = await query(
      "SELECT COUNT(*) count FROM approvals WHERE quotation_id = ? AND status = 'PENDING'",
      [approval.quotation_id],
    );
    if (!pending[0].count) {
      await query("UPDATE quotations SET status = 'APPROVED', approval_required = FALSE WHERE id = ?", [
        approval.quotation_id,
      ]);
      await query(
        "INSERT INTO quotation_status_history (quotation_id, old_status, new_status, changed_by, reason) VALUES (?, 'PENDING_APPROVAL', 'APPROVED', ?, ?)",
        [approval.quotation_id, userId || null, reason || 'Approved by ' + (approval.required_role || 'approver')],
      );
    }
  }

  return result;
}

module.exports = { createForQuotation, decide };
