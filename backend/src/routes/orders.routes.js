const router = require('express').Router();
const c = require('../controllers/warehouse.controller');

router.post('/', c.createOrder);
router.get('/', c.listOrders);
router.get('/:id', c.getOrder);
router.post('/:id/fulfill', c.fulfill);
router.get('/:id/fulfillment', c.fulfillmentStatus);

module.exports = router;