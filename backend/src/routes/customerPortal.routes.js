const router = require('express').Router();
const c = require('../controllers/customerPortal.controller');
router.get('/customer/quotations', c.quotations); router.get('/customer/quotations/:id', c.quotation);
router.get('/customer/negotiations/:id', c.negotiations); router.post('/customer/negotiations/:id/message', c.message);
router.post('/customer/quotations/:id/accept', c.decision); router.post('/customer/quotations/:id/reject', c.decision);
router.post('/customer/quotations/:id/requests', c.createRequest); router.get('/customer/quotations/:id/requests', c.requests);
module.exports = router;