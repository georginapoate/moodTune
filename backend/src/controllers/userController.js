// backend/src/controllers/userController.js

const { getDb } = require('../db/connection');
const { decrypt } = require('../../utils/crypto');
const SpotifyWebApi = require('spotify-web-api-node');
const { ObjectId } = require('mongodb');
const { findUserById } = require('../services/dbService');

const getMe = async (req, res) => {
  try {
    const user = await findUserById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found in our database' });
    }
    const userProfile = {
      spotifyId: user.spotifyId,
      displayName: user.displayName,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
      product: user.product,
      followers: user.followers
    };
    
    res.json(userProfile);

  } catch (error) {
    console.error("Error in getMe endpoint:", error);
    res.status(500).json({ message: "Failed to fetch Spotify profile" });
  }
};

const getPromptHistory = async (req, res) => {
  try {
    const promptsCollection = getDb().collection('prompts');
    const userIdAsObject = new ObjectId(req.userId); 
    
    const history = await promptsCollection.aggregate([
      { $match: { userId: userIdAsObject } },
      { $sort: { createdAt: -1 } },
      { $unwind: '$generatedSongIds' },
      {
        $lookup: {
          from: 'songs',
          localField: 'generatedSongIds',
          foreignField: '_id',
          as: 'songDetails'
        }
      },
      
      { $unwind: '$songDetails' },

      {
        $group: {
          _id: '$_id',
          promptText: { $first: '$promptText' },
          createdAt: { $first: '$createdAt' },
          songs: { $push: '$songDetails' }
        }
      },
      
      { $sort: { createdAt: -1 } }

    ]).toArray();

    res.json(history);

  } catch (error) {
    console.error("Error fetching prompt history:", error);
    res.status(500).json({ message: "Failed to fetch history." });
  }
};


module.exports = {
  getMe,
  getPromptHistory
};