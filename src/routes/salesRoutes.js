// src/routes/salesRoutes.js
const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

router.post('/register', salesController.registerSale);
router.get('/recent', salesController.getRecentSales);
router.delete('/:id', salesController.deleteSale); // <-- Nueva ruta

module.exports = router;