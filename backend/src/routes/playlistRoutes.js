// backend/routes/playlistRoutes.js
const express = require('express');
const router = express.Router();

// Import the controller function
const { generatePlaylist, createSpotifyPlaylist, deleteGeneratedPlaylist } = require('../controllers/playlistController');

// Define the route and tell it to use the controller function to handle the request
router.post('/generate', generatePlaylist);
router.post('/create', createSpotifyPlaylist);
router.delete('/:playlistId', deleteGeneratedPlaylist);

module.exports = router;