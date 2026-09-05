const { query } = require('../config/db');
async function list() { return query('SELECT * FROM customers ORDER BY created_at DESC'); }
async function findById(id) { const rows = await query('SELECT * FROM customers WHERE id = ?', [id]); return rows[0] || null; }
async function create(data) { const result = await query('INSERT INTO customers (name, email, company_name, tier, status) VALUES (?, ?, ?, ?, ?)', [data.name, data.email || null, data.company_name || null, data.tier || 'BRONZE', data.status || 'ACTIVE']); return findById(result.insertId); }
async function update(id, data) { await query('UPDATE customers SET name = COALESCE(?, name), email = COALESCE(?, email), company_name = COALESCE(?, company_name), tier = COALESCE(?, tier), status = COALESCE(?, status) WHERE id = ?', [data.name ?? null, data.email ?? null, data.company_name ?? null, data.tier ?? null, data.status ?? null, id]); return findById(id); }
async function remove(id) { const result = await query('UPDATE customers SET status = \'INACTIVE\' WHERE id = ?', [id]); return result.affectedRows > 0; }
module.exports = { list, findById, create, update, remove };
