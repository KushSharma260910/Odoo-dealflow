const router = require('express').Router();
const c = require('../controllers/dashboard.controller');
router.get('/dashboard/overview', c.overview); router.get('/dashboard/sales', c.sales); router.get('/dashboard/deals', c.deals); router.get('/dashboard/risks', c.risks); router.get('/dashboard/revenue', c.revenue);
module.exports = router;