const router = require('express').Router();
const c = require('../controllers/quotation.controller');
const riskController = require('../controllers/risk.controller');

router.post('/', c.create);
router.get('/', c.list);
router.get('/:id', c.get);
router.put('/:id', c.update);
router.post('/:id/items', c.addItem);
router.put('/:id/items/:itemId', c.updateItem);
router.delete('/:id/items/:itemId', c.removeItem);
router.post('/:id/submit', c.submit);
router.get('/:id/risk', riskController.get);
router.post('/:id/risk/analyze', riskController.analyze);

module.exports = router;
