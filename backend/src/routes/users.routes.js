const router = require('express').Router();
const c = require('../controllers/user.controller');

router.get('/', c.list);
router.get('/:id', c.get);
router.put('/:id', c.update);
router.patch('/:id/status', c.status);

module.exports = router;