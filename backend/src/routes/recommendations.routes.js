const router = require('express').Router();
const c = require('../controllers/recommendation.controller');

router.get('/:quotationId', c.quotation);

module.exports = router;