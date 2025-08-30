// backend/src/controllers/userController.js

const { getDb } = require('../db/connection');
const { decrypt } = require('../../utils/crypto');
const SpotifyWebApi = require('spotify-web-api-node');
const { ObjectId } = require('mongodb'); // <-- 1. IMPORT ObjectId

const getMe = async (req, res) => {
  try {
    const usersCollection = getDb().collection('users');

    // req.userId is the STRING from the JWT. We must convert it to a
    // MongoDB ObjectId before we can use it to find a document.
    if (!req.userId || !ObjectId.isValid(req.userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    const userIdAsObject = new ObjectId(req.userId); // <-- 2. CONVERT the string to an ObjectId

    // 3. USE the ObjectId in the query
    const user = await usersCollection.findOne({ _id: userIdAsObject });

    if (!user) {
      return res.status(404).json({ message: 'User not found in our database' });
    }

    const accessToken = decrypt(user.accessToken);

    const spotifyApi = new SpotifyWebApi();
    spotifyApi.setAccessToken(accessToken);
    const meResponse = await spotifyApi.getMe();
    
    // We send back the Spotify profile, which is what the frontend expects.
    res.json(meResponse.body);

  } catch (error) {
    console.error("Error in /me endpoint:", error);
    res.status(500).json({ message: "Failed to fetch Spotify profile" });
  }
};

module.exports = { getMe };