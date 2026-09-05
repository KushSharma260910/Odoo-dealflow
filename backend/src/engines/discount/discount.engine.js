const { query } = require('../../config/db');
async function evaluate(quotationId) {
	const quotes = await query('SELECT q.*, c.tier FROM quotations q JOIN customers c ON c.id = q.customer_id WHERE q.id = ?', [quotationId]);
	if (!quotes[0]) throw new Error('Quotation not found');
	const items = await query('SELECT qi.*, p.category_id FROM quotation_items qi JOIN products p ON p.id = qi.product_id WHERE qi.quotation_id = ?', [quotationId]);
	let approvalRequired = false; const violations = [];
	for (const item of items) {
		const rules = await query('SELECT * FROM discount_rules WHERE active = TRUE AND customer_tier = ? AND (category_id = ? OR category_id IS NULL) ORDER BY category_id IS NULL', [quotes[0].tier, item.category_id]);
		const rule = rules[0];
		if (rule && Number(item.discount_percent) > Number(rule.max_discount_percent)) violations.push({ item_id: item.id, discount_percent: item.discount_percent, max_discount_percent: rule.max_discount_percent });
		if (rule && Number(item.discount_percent) > Number(rule.approval_required_above)) approvalRequired = true;
	}
	await query('UPDATE quotations SET approval_required = ?, status = CASE WHEN ? = TRUE THEN \'PENDING_APPROVAL\' ELSE status END WHERE id = ?', [approvalRequired, approvalRequired, quotationId]);
	return { quotation_id: Number(quotationId), approval_required: approvalRequired, violations };
}
module.exports = { evaluate };
