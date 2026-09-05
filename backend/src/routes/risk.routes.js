const router = require('express').Router();
const c = require('../controllers/risk.controller');
router.get('/quotations/:id/risk', c.get); router.post('/quotations/:id/risk/analyze', c.analyze);
module.exports = router;