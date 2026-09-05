function errorMiddleware(error, req, res, next) {
	if (res.headersSent) return next(error);
	const status = error.code === 'ER_DUP_ENTRY' ? 409 : error.status || 500;
	res.status(status).json({ success: false, error: status === 500 ? 'Internal server error' : error.message });
}
module.exports = errorMiddleware;
