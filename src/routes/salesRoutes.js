const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

router.post('/register', salesController.registerSale);
router.get('/clients/:storeId', salesController.getUniqueClients);
router.delete('/:id', salesController.deleteSale);

module.exports = router;
