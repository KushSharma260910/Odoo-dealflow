const { query } = require('../config/db');
async function list() { return query('SELECT id, customer_id, name, email, role, status, created_at, updated_at FROM users ORDER BY name'); }
async function findById(id) { const rows = await query('SELECT id, customer_id, name, email, role, status, created_at, updated_at FROM users WHERE id = ?', [id]); return rows[0] || null; }
async function update(id, data) { await query('UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), role = COALESCE(?, role), customer_id = COALESCE(?, customer_id) WHERE id = ?', [data.name ?? null, data.email ?? null, data.role ?? null, data.customer_id ?? null, id]); return findById(id); }
async function setStatus(id, status) { await query('UPDATE users SET status = ? WHERE id = ?', [status, id]); return findById(id); }
module.exports = { list, findById, update, setStatus };
