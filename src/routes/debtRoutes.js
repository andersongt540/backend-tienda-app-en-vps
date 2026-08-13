const express = require('express');
const router = express.Router();
const debtController = require('../controllers/debtController');

router.get('/store/:storeId', debtController.getDebtsByStore);
router.post('/register', debtController.registerDebt);
router.delete('/:id', debtController.deleteDebt);
router.put('/:id/pay', debtController.markAsPaid);

module.exports = router;
