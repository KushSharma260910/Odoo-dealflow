const router = require('express').Router();
const c = require('../controllers/customer.controller');
router.post('/customers', c.create); router.get('/customers', c.list); router.get('/customers/:id', c.get); router.put('/customers/:id', c.update); router.delete('/customers/:id', c.remove);
module.exports = router;
