const router = require('express').Router();
const c = require('../controllers/customerPortal.controller');
const billingController = require('../controllers/billing.controller');

router.get('/quotations', c.quotations);
router.get('/quotations/:id', c.quotation);
router.get('/negotiations/:id', c.negotiations);
router.post('/negotiations/:id/message', c.message);
router.post('/quotations/:id/accept', c.decision);
router.post('/quotations/:id/reject', c.decision);
router.post('/quotations/:id/requests', c.createRequest);
router.get('/quotations/:id/requests', c.requests);

router.get('/invoices', billingController.customerInvoices);
router.get('/invoices/:id', billingController.customerInvoice);
router.get('/billing/:quotationId', billingController.customerBilling);

module.exports = router;