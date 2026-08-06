const express = require('express');
const router = express.Router();
const { setupStore, getStoreBalance } = require('../controllers/storeController');

router.post('/setup', setupStore);
router.get('/balance/:userId', getStoreBalance);

module.exports = router;