const router = require('express').Router();
const c = require('../controllers/approval.controller');
router.post('/approvals/rules', c.createRule); router.get('/approvals/rules', c.rulesList); router.get('/approvals', c.list); router.get('/approvals/:id', c.get); router.post('/approvals/:id/approve', c.approve); router.post('/approvals/:id/reject', c.reject);
module.exports = router;
