const router = require('express').Router();
const c = require('../controllers/negotiation.controller');

router.get('/', c.list);
router.get('/:id', c.get);
router.post('/:id/message', c.message);
router.post('/:id/respond', c.respond);

module.exports = router;