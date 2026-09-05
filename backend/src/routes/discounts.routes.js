const router = require('express').Router();
const c = require('../controllers/discount.controller');
router.post('/discounts/rules', c.create); router.get('/discounts/rules', c.list); router.put('/discounts/rules/:id', c.update); router.post('/discounts/evaluate/:quotationId', c.evaluate);
module.exports = router;
