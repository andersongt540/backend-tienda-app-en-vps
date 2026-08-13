const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

router.get('/:storeId', statsController.getStoreStats);

module.exports = router;
