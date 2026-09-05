const router = require('express').Router();
const c = require('../controllers/warehouse.controller');
router.post('/warehouses', c.create); router.get('/warehouses', c.list); router.get('/warehouses/:id', c.get); router.put('/warehouses/:id', c.update);
router.get('/warehouses/:id/stock', c.stock); router.put('/warehouses/:id/stock', c.updateStock); router.post('/warehouses/allocate', c.allocate);
router.post('/orders', c.createOrder); router.get('/orders', c.listOrders); router.get('/orders/:id', c.getOrder); router.post('/orders/:id/fulfill', c.fulfill); router.get('/orders/:id/fulfillment', c.fulfillmentStatus);
module.exports = router;