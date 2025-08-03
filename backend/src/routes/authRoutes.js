// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();

// Import the controller functions
const { spotifyLogin, spotifyCallback } = require('../controllers/authController');

// Define the routes and map them to their controller functions
router.get('/login', spotifyLogin);
router.get('/callback', spotifyCallback);

module.exports = router;