require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authMiddleware = require('./middleware/authMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();
app.use(express.json());
app.use(cors());
app.use(authMiddleware.optional);

app.get('/', (req, res) => res.json({ success: true, service: 'dealflow360-api', message: 'API is running', health: '/health' }));
app.get('/health', (req, res) => res.json({ success: true, service: 'dealflow360-api' }));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/customers', require('./routes/customers.routes'));
app.use('/api/products', require('./routes/products.routes'));
app.use('/api/quotations', require('./routes/quotations.routes'));
app.use('/api/discounts', require('./routes/discounts.routes'));
app.use('/api/approvals', require('./routes/approvals.routes'));
app.use('/api/warehouses', require('./routes/warehouses.routes'));
app.use('/api/orders', require('./routes/orders.routes'));
app.use('/api/negotiations', require('./routes/negotiations.routes'));
app.use('/api/customer', require('./routes/customerPortal.routes'));
app.use('/api/billing', require('./routes/billing.routes'));
app.use('/api/recommendations', require('./routes/recommendations.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/audit', require('./routes/audit.routes'));

app.use(errorMiddleware);

module.exports = app;
