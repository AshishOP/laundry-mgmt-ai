const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');
const { registerValidation, loginValidation } = require('../middleware/validate');

// Only an admin can register a new user.
// The public registration is removed to prevent unauthorized sign-ups.
router.post('/register', authenticate, authorize('admin'), registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', authenticate, getMe);

module.exports = router;
