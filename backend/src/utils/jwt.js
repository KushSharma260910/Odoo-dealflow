const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET || 'dealflow360_secret';

function generateToken(user) {
	return jwt.sign({ id: user.id, customer_id: user.customer_id || null, email: user.email, role: user.role }, secret, { expiresIn: '1d' });
}

function verifyToken(token) { return jwt.verify(token, secret); }

module.exports = { generateToken, verifyToken };
