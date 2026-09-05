const { query } = require('../config/db');

async function list(user) {
	const where = user?.role === 'CUSTOMER' ? 'WHERE n.customer_id = ?' : '';
	return query(
		`SELECT n.*, c.name AS customer_name FROM negotiations n
		 JOIN customers c ON c.id = n.customer_id ${where} ORDER BY n.updated_at DESC`,
		user?.role === 'CUSTOMER' ? [user.customer_id] : []
	);
}

async function findById(id) {
	const rows = await query(
		`SELECT n.*, c.name AS customer_name, q.total_amount, q.status AS quotation_status
		 FROM negotiations n JOIN customers c ON c.id = n.customer_id
		 JOIN quotations q ON q.id = n.quotation_id WHERE n.id = ?`, [id]
	);
	return rows[0] || null;
}

async function messages(id) {
	return query(
		`SELECT nm.*, u.name AS sender_name, u.role AS sender_role
		 FROM negotiation_messages nm JOIN users u ON u.id = nm.sender_user_id
		 WHERE nm.negotiation_id = ? ORDER BY nm.created_at`, [id]
	);
}

async function addMessage(id, senderUserId, message) {
	const result = await query('INSERT INTO negotiation_messages (negotiation_id, sender_user_id, message) VALUES (?, ?, ?)', [id, senderUserId, message]);
	return query('SELECT * FROM negotiation_messages WHERE id = ?', [result.insertId]).then(rows => rows[0]);
}

async function respond(id, status, data = {}) {
	await query(
		'UPDATE negotiations SET status = ?, proposed_discount_percent = COALESCE(?, proposed_discount_percent), proposed_total = COALESCE(?, proposed_total) WHERE id = ?',
		[status, data.proposed_discount_percent ?? null, data.proposed_total ?? null, id]
	);
	return findById(id);
}

module.exports = { list, findById, messages, addMessage, respond };
