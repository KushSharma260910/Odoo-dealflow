const { query } = require('../config/db');

async function findById(id) {
	const rows = await query('SELECT * FROM invoices WHERE id = ?', [id]);
	return rows[0] || null;
}

async function listAll() {
	return query(
		`SELECT i.*, o.quotation_id, c.name AS customer_name
		 FROM invoices i
		 JOIN orders o ON o.id = i.order_id
		 JOIN quotations q ON q.id = o.quotation_id
		 JOIN customers c ON c.id = q.customer_id
		 ORDER BY i.created_at DESC`
	);
}

async function byQuotation(quotationId) {
	return query('SELECT * FROM invoices WHERE order_id IN (SELECT id FROM orders WHERE quotation_id = ?) ORDER BY created_at DESC', [quotationId]);
}

async function byCustomer(customerId) {
	return query(
		`SELECT i.*, o.quotation_id FROM invoices i JOIN orders o ON o.id = i.order_id
		 JOIN quotations q ON q.id = o.quotation_id WHERE q.customer_id = ? ORDER BY i.created_at DESC`, [customerId]
	);
}

async function create(data) {
	const result = await query(
		'INSERT INTO invoices (order_id, invoice_number, invoice_type, amount, due_date) VALUES (?, ?, ?, ?, ?)',
		[data.order_id, data.invoice_number, data.invoice_type, data.amount, data.due_date || null]
	);
	return findById(result.insertId);
}

module.exports = { findById, listAll, byQuotation, byCustomer, create };
