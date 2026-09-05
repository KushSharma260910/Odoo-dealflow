const router = require('express').Router();
const c = require('../controllers/recommendation.controller');
router.get('/recommendations/:quotationId', c.quotation); router.get('/products/:id/recommendations', c.product);
module.exports = router;