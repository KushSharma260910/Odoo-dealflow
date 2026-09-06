const { query } = require('../config/db');

async function list(filters = {}) {
  const params = [];
  const conditions = [];

  if (filters.status && filters.status !== 'ALL') {
    conditions.push('a.status = ?');
    params.push(filters.status);
  }

  if (filters.role && filters.role !== 'ADMIN') {
    conditions.push('a.required_role = ?');
    params.push(filters.role);
  }

  if (filters.quotation_id) {
    conditions.push('a.quotation_id = ?');
    params.push(filters.quotation_id);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  return query(
    `SELECT a.*, 
            q.customer_id, q.sales_rep_id, q.total_amount, q.risk_score, q.risk_level, q.status AS quotation_status,
            c.name AS customer_name,
            u.name AS approver_name,
            rep.name AS sales_rep_name
     FROM approvals a
     JOIN quotations q ON q.id = a.quotation_id
     JOIN customers c ON c.id = q.customer_id
     LEFT JOIN users rep ON rep.id = q.sales_rep_id
     LEFT JOIN users u ON u.id = a.approver_id
     ${where}
     ORDER BY a.created_at DESC`,
    params
  );
}
async function findById(id) { const rows = await query('SELECT * FROM approvals WHERE id = ?', [id]); return rows[0] || null; }
async function decide(id, status, approverId, reason) { await query('UPDATE approvals SET status = ?, approver_id = ?, reason = ?, decided_at = CURRENT_TIMESTAMP WHERE id = ? AND status = \'PENDING\'', [status, approverId || null, reason || null, id]); return findById(id); }
async function createRule(data) { const result = await query('INSERT INTO approval_rules (chain_id, approval_level, role, min_discount_percent, max_discount_percent, min_risk_score, max_risk_score) VALUES (?, ?, ?, ?, ?, ?, ?)', [data.chain_id, data.approval_level, data.role, data.min_discount_percent || 0, data.max_discount_percent ?? 100, data.min_risk_score || 0, data.max_risk_score ?? 100]); return query('SELECT * FROM approval_rules WHERE id = ?', [result.insertId]).then(rows => rows[0]); }
async function rules() { return query('SELECT ar.*, ac.name AS chain_name FROM approval_rules ar JOIN approval_chains ac ON ac.id = ar.chain_id ORDER BY ar.chain_id, ar.approval_level'); }
module.exports = { list, findById, decide, createRule, rules };
