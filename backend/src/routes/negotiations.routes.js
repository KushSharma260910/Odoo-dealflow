const router = require('express').Router();
const c = require('../controllers/negotiation.controller');
router.get('/negotiations', c.list); router.get('/negotiations/:id', c.get); router.post('/negotiations/:id/message', c.message); router.post('/negotiations/:id/respond', c.respond);
module.exports = router;