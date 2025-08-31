// backend/controllers/playlistController.js
const { getSpotifyApi, searchTrackOnSpotify, createPlaylistFromTracks} = require('../services/spotifyService');
const { findSimilarSongs, findUserById, savePromptToHistory  } = require('../services/dbService');
const { getOpenAIEmbedding } = require('../services/openaiService');
const { decrypt } = require('../../utils/crypto');
const { ObjectId } = require('mongodb');
const { getDb } = require('../db/connection');

const generatePlaylist = async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'A prompt is required.' });
    }

    const user = await findUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const accessToken = decrypt(user.accessToken);
    const spotifyApi = getSpotifyApi(accessToken);

    try {
        console.log("1. Generating embedding for prompt...");
        const promptEmbedding = await getOpenAIEmbedding(prompt);
        const recommendedSongs = await findSimilarSongs(promptEmbedding);

        if (recommendedSongs.length === 0) {
            return res.status(404).json({ error: 'Could not find any matching songs.' });
        }
        console.log(`2. Found ${recommendedSongs.length} recommended songs.`);

        const results = [];

        console.log(`3. Fetching Spotify metadata for each song...`);

        for (const doc of recommendedSongs) {
            const spotifyMeta = await searchTrackOnSpotify(spotifyApi, doc.artist, doc.title);
            results.push({
                artist: doc.artist,
                title: doc.title,
                album: doc.album || null,
                score: doc.score || null,
                spotifyTrackId: spotifyMeta?.spotifyTrackId || null,
                spotifyUri: spotifyMeta?.spotifyUri || null,
                previewUrl: spotifyMeta?.previewUrl || null,
                albumImage: spotifyMeta?.albumImage || 'https://picsum.photos/200',
                spotifyExternalUrl: spotifyMeta?.spotifyExternalUrl || null,
            });
        }

        if (results.length > 0) {
            const songIds = recommendedSongs.map(song => new ObjectId(song._id));
            await savePromptToHistory(req.userId, prompt, songIds);
        }
        console.log(`4. Returning ${results.length} songs to frontend.`);
        return res.json({ songs: results, prompt });

    } catch (error) {
        console.error('An error occurred in the playlist controller:', error);
        res.status(500).json({ error: 'Failed to generate playlist.' });
    }
};

const createSpotifyPlaylist = async (req, res) => {
    try {
        const { songs, prompt } = req.body;
        if ( !songs || !prompt) {
            return res.status(400).json({ error: 'Songs, and prompt are required.' });
        }

        const user = await findUserById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const accessToken = decrypt(user.accessToken);

        const playlist = await createPlaylistFromTracks(accessToken, songs, prompt);

        res.json({
            success: true,
            playlistUrl: playlist.playlistUrl,
            addedTracks: playlist.tracks.length,
        });
    } catch (error) {
        console.error('Error in savePlaylist:', error?.message || error);
        return res.status(500).json({ error: 'Failed to create playlist.' });
    }

};

const deleteGeneratedPlaylist = async (req, res) => {
    try {
        const { playlistId: promptId } = req.params;
        const userId = req.userId;

        if (!ObjectId.isValid(promptId)) {
            return res.status(400).json({ error: 'Invalid playlist history ID format.' });
        }

        const promptsCollection = getDb().collection('prompts');

        const query = {
            _id: new ObjectId(promptId),
            userId: new ObjectId(userId)
        };
       console.log("Query for deletion:", query);
        // Attempt to delete the document    

        const result = await promptsCollection.deleteOne(query);
        
        console.log("Result from deleteOne:", result);
        if (result.deletedCount === 1) {
            res.status(200).json({ message: 'Playlist history successfully deleted.' });
        } else {
            res.status(404).json({ message: 'Playlist history not found or you do not have permission to delete it.' });
        }
    } catch (error) {
        console.error('Error in deleteGeneratedPlaylist controller:', error.message);
        res.status(500).json({ error: 'Failed to delete playlist.' });
    }
}

module.exports = {
    generatePlaylist,
    createSpotifyPlaylist,
    deleteGeneratedPlaylist,
    savePromptToHistory
};