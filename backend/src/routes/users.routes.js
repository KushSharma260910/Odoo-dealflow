const router = require('express').Router();
const c = require('../controllers/user.controller');
router.get('/users', c.list); router.get('/users/:id', c.get); router.put('/users/:id', c.update); router.patch('/users/:id/status', c.status);
module.exports = router;