const router = require('express').Router();
const c = require('../controllers/product.controller');
const recommendationController = require('../controllers/recommendation.controller');

router.post('/import', c.bulkImport);
router.post('/', c.create);
router.get('/', c.list);
router.get('/:id', c.get);
router.put('/:id', c.update);
router.delete('/:id', c.remove);
router.get('/:id/recommendations', recommendationController.product);

module.exports = router;
