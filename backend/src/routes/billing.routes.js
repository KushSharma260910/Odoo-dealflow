const router = require('express').Router();
const c = require('../controllers/billing.controller');
router.post('/billing/calculate', c.calculate); router.post('/billing/generate', c.generate); router.get('/billing/:quotationId', c.byQuotation);
router.get('/customer/invoices', c.customerInvoices); router.get('/customer/invoices/:id', c.customerInvoice); router.get('/customer/billing/:quotationId', c.customerBilling);
module.exports = router;