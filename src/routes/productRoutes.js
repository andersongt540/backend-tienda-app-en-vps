const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/store/:storeId', productController.getProductsByStore);
router.post('/register', productController.registerProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
