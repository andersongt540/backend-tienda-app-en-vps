const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getUsers);
router.patch('/:id/status', userController.updateUserStatus);

module.exports = router;