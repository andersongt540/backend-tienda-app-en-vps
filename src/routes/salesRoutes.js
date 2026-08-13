const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

router.post('/register', salesController.registerSale);
router.delete('/:id', salesController.deleteSale);

module.exports = router;
