const { query } = require('../config/db');

async function list(filters = {}) {
	const conditions = [];
	const params = [];
	if (filters.entity_type) { conditions.push('entity_type = ?'); params.push(filters.entity_type); }
	if (filters.entity_id) { conditions.push('entity_id = ?'); params.push(filters.entity_id); }
	const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
	return query(`SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT 500`, params);
}

async function findById(id) {
	const rows = await query('SELECT * FROM audit_logs WHERE id = ?', [id]);
	return rows[0] || null;
}

async function record(data) {
	const result = await query(
		'INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_value, new_value, reason, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
		[data.user_id || null, data.entity_type, data.entity_id, data.action, data.old_value ? JSON.stringify(data.old_value) : null, data.new_value ? JSON.stringify(data.new_value) : null, data.reason || null, data.ip_address || null]
	);
	return findById(result.insertId);
}

module.exports = { list, findById, record };
