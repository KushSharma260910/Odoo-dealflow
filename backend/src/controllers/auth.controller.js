const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { generateToken } = require('../utils/jwt');

async function register(req, res, next) {
    try {
        const { name, email, password, role = 'CUSTOMER', customer_id } = req.body;
        if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required' });
        if (role !== 'CUSTOMER') return res.status(403).json({ success: false, message: 'Only customer self-registration is allowed' });
        const passwordHash = await bcrypt.hash(password, 10);
        const [result] = await pool.execute('INSERT INTO users (customer_id, name, email, password, role) VALUES (?, ?, ?, ?, ?)', [customer_id || null, name, email, passwordHash, role]);
        return res.status(201).json({ success: true, user: { id: result.insertId, name, email, role } });
    } catch (error) { next(error); }
}

async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });
        const [users] = await pool.execute('SELECT id, customer_id, name, email, password, role, status FROM users WHERE email = ?', [email]);
        const user = users[0];
        if (!user || user.status !== 'ACTIVE' || !user.password || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ success: false, message: 'Invalid email or password' });
        return res.json({ success: true, token: generateToken(user), user: { id: user.id, customer_id: user.customer_id, name: user.name, email: user.email, role: user.role } });
    } catch (error) { next(error); }
}

async function me(req, res, next) {
    try {
        const [users] = await pool.execute('SELECT id, customer_id, name, email, role, status, created_at FROM users WHERE id = ?', [req.user.id]);
        return users[0] ? res.json({ success: true, user: users[0] }) : res.status(404).json({ success: false, message: 'User not found' });
    } catch (error) { next(error); }
}

module.exports = { register, login, me };