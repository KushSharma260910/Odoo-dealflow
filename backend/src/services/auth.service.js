const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { generateToken } = require('../utils/jwt');
async function register(data) { const hash = await bcrypt.hash(data.password, 10); const [result] = await pool.execute('INSERT INTO users (customer_id, name, email, password, role) VALUES (?, ?, ?, ?, ?)', [data.customer_id || null, data.name, data.email, hash, data.role || 'CUSTOMER']); return { id: result.insertId, name: data.name, email: data.email, role: data.role || 'CUSTOMER' }; }
async function login(email, password) { const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]); const user = rows[0]; if (!user || user.status !== 'ACTIVE' || !user.password || !(await bcrypt.compare(password, user.password))) return null; return { token: generateToken(user), user: { id: user.id, customer_id: user.customer_id, name: user.name, email: user.email, role: user.role } }; }
module.exports = { register, login };
