const router = require('express').Router();
const c = require('../controllers/approval.controller');

router.post('/rules', c.createRule);
router.get('/rules', c.rulesList);
router.get('/', c.list);
router.get('/:id', c.get);
router.post('/:id/approve', c.approve);
router.post('/:id/reject', c.reject);

module.exports = router;
