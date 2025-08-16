// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();

// Import the controller functions
const { spotifyLogin, spotifyCallback, checkPremiumStatus } = require('../controllers/authController');

// Define the routes and map them to their controller functions
router.get('/login', spotifyLogin);
router.get('/callback', spotifyCallback);
router.get('/check-premium', checkPremiumStatus);

module.exports = router;