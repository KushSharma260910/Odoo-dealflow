const router = require('express').Router();
const c = require('../controllers/product.controller');
router.post('/products', c.create); router.get('/products', c.list); router.get('/products/:id', c.get); router.put('/products/:id', c.update); router.delete('/products/:id', c.remove);
module.exports = router;
