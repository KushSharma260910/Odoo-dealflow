require('dotenv').config();
const express = require('express');
const authMiddleware = require('./middleware/authMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();
app.use(express.json());
app.use(require('cors')());
app.use(authMiddleware.optional);
app.get('/', (req, res) => res.json({ success: true, service: 'dealflow360-api', message: 'API is running', health: '/health' }));
app.get('/health', (req, res) => res.json({ success: true, service: 'dealflow360-api' }));
app.get('/api', (req, res) => res.json({
	success: true,
	service: 'dealflow360-api',
	message: 'API is running',
	health: '/health',
	routes: {
		auth: '/api/auth',
		users: '/api/users',
		customers: '/api/customers',
		products: '/api/products',
		quotations: '/api/quotations',
		warehouses: '/api/warehouses',
		orders: '/api/orders',
		billing: '/api/billing',
		dashboard: '/api/dashboard/overview',
		audit: '/api/audit'
	}
}));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api', require('./routes/users.routes'));
app.use('/api', require('./routes/customers.routes'));
app.use('/api', require('./routes/products.routes'));
app.use('/api', require('./routes/quotations.routes'));
app.use('/api', require('./routes/discounts.routes'));
app.use('/api', require('./routes/approvals.routes'));
app.use('/api', require('./routes/risk.routes'));
app.use('/api', require('./routes/warehouses.routes'));
app.use('/api', require('./routes/negotiations.routes'));
app.use('/api', require('./routes/customerPortal.routes'));
app.use('/api', require('./routes/billing.routes'));
app.use('/api', require('./routes/recommendations.routes'));
app.use('/api', require('./routes/dashboard.routes'));
app.use('/api', require('./routes/audit.routes'));
app.use(errorMiddleware);

module.exports = app;
