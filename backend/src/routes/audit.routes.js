const router = require('express').Router();
const c = require('../controllers/audit.controller');

router.get('/', c.list);
router.get('/:id', c.get);

module.exports = router;