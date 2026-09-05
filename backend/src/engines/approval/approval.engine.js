const { query } = require('../../config/db');
const model = require('../../models/approval.model');
async function createForQuotation(quotationId) {
	const quote = (await query('SELECT risk_score, discount_amount, subtotal FROM quotations WHERE id = ?', [quotationId]))[0];
	if (!quote) throw new Error('Quotation not found');
	const chains = await query('SELECT * FROM approval_chains WHERE active = TRUE AND ? BETWEEN min_risk_score AND max_risk_score ORDER BY min_risk_score LIMIT 1', [quote.risk_score || 0]);
	if (!chains[0]) return [];
	const rules = await query('SELECT * FROM approval_rules WHERE chain_id = ? ORDER BY approval_level', [chains[0].id]);
	for (const rule of rules) await query('INSERT INTO approvals (quotation_id, approval_chain_id, approval_level, required_role) VALUES (?, ?, ?, ?)', [quotationId, chains[0].id, rule.approval_level, rule.role]);
	return model.list({ quotation_id: quotationId });
}
async function decide(id, status, userId, reason) { const approval = await model.findById(id); if (!approval) throw new Error('Approval not found'); const result = await model.decide(id, status, userId, reason); if (status === 'REJECTED') await query('UPDATE quotations SET status = \'REJECTED\' WHERE id = ?', [approval.quotation_id]); if (status === 'APPROVED') { const pending = await query('SELECT COUNT(*) count FROM approvals WHERE quotation_id = ? AND status = \'PENDING\'', [approval.quotation_id]); if (!pending[0].count) await query('UPDATE quotations SET status = \'APPROVED\' WHERE id = ?', [approval.quotation_id]); } return result; }
module.exports = { createForQuotation, decide };
