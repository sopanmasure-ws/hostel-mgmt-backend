const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
// const { protect } = require('../middleware/auth'); // Temporarily commented out

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', getMe);

module.exports = router;
