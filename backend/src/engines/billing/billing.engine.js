const { query } = require('../../config/db');
const invoiceModel = require('../../models/invoice.model');

async function calculate(quotationId) {
	const rows = await query(
		`SELECT COALESCE(SUM(unit_price * quantity), 0) subtotal,
				COALESCE(SUM(discount_amount), 0) discount_amount,
				COALESCE(SUM(tax_amount), 0) tax_amount,
				COALESCE(SUM(line_total), 0) total_amount
		 FROM quotation_items WHERE quotation_id = ?`, [quotationId]
	);
	return rows[0];
}

async function generate(orderId, data = {}) {
	const rows = await query('SELECT * FROM orders WHERE id = ?', [orderId]);
	if (!rows[0]) throw new Error('Order not found');
	const items = await query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
	const recurring = items.some(item => item.billing_type === 'RECURRING');
	const oneTime = items.some(item => item.billing_type === 'ONE_TIME');
	return invoiceModel.create({
		order_id: orderId,
		invoice_number: data.invoice_number || `INV-${Date.now()}-${orderId}`,
		invoice_type: recurring && oneTime ? 'MIXED' : recurring ? 'RECURRING' : 'ONE_TIME',
		amount: data.amount ?? rows[0].total_amount,
		due_date: data.due_date
	});
}

module.exports = { calculate, generate };
