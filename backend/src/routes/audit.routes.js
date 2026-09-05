const router = require('express').Router();
const c = require('../controllers/audit.controller');
router.get('/audit', c.list); router.get('/audit/:id', c.get);
module.exports = router;