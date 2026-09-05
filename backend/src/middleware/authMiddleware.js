const { verifyToken } = require('../utils/jwt');

function readUser(req) {
	const header = req.headers.authorization;
	if (!header || !header.startsWith('Bearer ')) return null;
	return verifyToken(header.slice(7));
}

function authenticate(req, res, next) {
	try {
		const user = readUser(req);
		if (!user) return res.status(401).json({ success: false, message: 'Authentication token required' });
		req.user = user;
		next();
	} catch (error) { return res.status(401).json({ success: false, message: 'Invalid or expired token' }); }
}

authenticate.optional = (req, res, next) => {
	try { req.user = readUser(req); } catch (error) { req.user = null; }
	next();
};

module.exports = authenticate;
