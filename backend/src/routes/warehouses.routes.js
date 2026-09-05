const router = require('express').Router();
const c = require('../controllers/warehouse.controller');

router.post('/', c.create);
router.get('/', c.list);
router.get('/:id', c.get);
router.put('/:id', c.update);
router.get('/:id/stock', c.stock);
router.put('/:id/stock', c.updateStock);
router.post('/allocate', c.allocate);

module.exports = router;