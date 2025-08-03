// backend/routes/playlistRoutes.js
const express = require('express');
const router = express.Router();

// Import the controller function
const { generatePlaylist } = require('../controllers/playlistController');

// Define the route and tell it to use the controller function to handle the request
router.post('/generate', generatePlaylist);

module.exports = router;