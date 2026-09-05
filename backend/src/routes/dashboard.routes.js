const router = require('express').Router();
const c = require('../controllers/dashboard.controller');

router.get('/overview', c.overview);
router.get('/sales', c.sales);
router.get('/deals', c.deals);
router.get('/risks', c.risks);
router.get('/revenue', c.revenue);

module.exports = router;