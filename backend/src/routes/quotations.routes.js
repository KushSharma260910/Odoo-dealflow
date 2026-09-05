const router = require('express').Router();
const c = require('../controllers/quotation.controller');
router.post('/quotations', c.create); router.get('/quotations', c.list); router.get('/quotations/:id', c.get); router.put('/quotations/:id', c.update);
router.post('/quotations/:id/items', c.addItem); router.put('/quotations/:id/items/:itemId', c.updateItem); router.delete('/quotations/:id/items/:itemId', c.removeItem); router.post('/quotations/:id/submit', c.submit);
module.exports = router;
