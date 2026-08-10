const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

router.get('/:storeId', categoryController.getCategoriesByStore);
router.post('/', categoryController.createCategory);

module.exports = router;