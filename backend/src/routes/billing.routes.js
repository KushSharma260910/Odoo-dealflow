const router = require('express').Router();
const c = require('../controllers/billing.controller');

router.post('/calculate', c.calculate);
router.post('/generate', c.generate);
router.get('/:quotationId', c.byQuotation);

module.exports = router;