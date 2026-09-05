const router = require('express').Router();
const c = require('../controllers/discount.controller');

router.post('/rules', c.create);
router.get('/rules', c.list);
router.put('/rules/:id', c.update);
router.post('/evaluate/:quotationId', c.evaluate);

module.exports = router;
