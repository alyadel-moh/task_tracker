const express = require('express');
const { register, login, me, logout } = require('../controllers/authcontroller');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.post('/register', register); // public route for user registration
router.post('/login', login);  // public route for user login
router.get('/me', authenticate, me); // private route to get current user info, requires authentication
router.post('/logout', authenticate, logout); // private route for user logout
module.exports = router;
