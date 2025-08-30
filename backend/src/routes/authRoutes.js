// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getPlayerToken } = require('../controllers/authController');
const { spotifyLogin, spotifyCallback, refreshToken } = require('../controllers/authController');
require('../controllers/authController');

router.get('/login', spotifyLogin);
router.get('/callback', spotifyCallback);
router.post('/refresh', refreshToken);

router.get('/player-token', protect, getPlayerToken);

module.exports = router;