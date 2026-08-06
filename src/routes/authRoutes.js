const express = require('express');
const router = express.Router();
const { register, verifyCode, login, generateCode } = require('../controllers/authController');

router.post('/register', register);
router.post('/verify-code', verifyCode);
router.post('/login', login);
router.post('/admin/generate-code', generateCode);

module.exports = router;