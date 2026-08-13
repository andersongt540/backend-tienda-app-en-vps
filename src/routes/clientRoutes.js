const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

router.get('/store/:storeId', clientController.getClients);
router.put('/:id', clientController.updateClient);

module.exports = router;
