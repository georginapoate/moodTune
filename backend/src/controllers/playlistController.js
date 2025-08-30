// backend/controllers/playlistController.js
const { getSpotifyApi, searchTrackOnSpotify, createPlaylistFromTracks, deletePlaylist } = require('../services/spotifyService');
const { findSimilarSongs, findUserById } = require('../services/dbService');
const { getOpenAIEmbedding } = require('../services/openaiService');
const { decrypt } = require('../../utils/crypto');

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
        const { playlistId } = req.params; // Get playlistId from the URL path
        if (!playlistId) {
            return res.status(400).json({ error: 'Playlist ID is required.' });
        }

        const user = await findUserById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const accessToken = decrypt(user.accessToken);
        await deletePlaylist(accessToken, playlistId);
        
        res.status(200).json({ message: 'Playlist successfully deleted.' });

    } catch (error) {
        console.error('Error in deleteGeneratedPlaylist controller:', error.message);
        res.status(500).json({ error: 'Failed to delete playlist.' });
    }
}

module.exports = {
    generatePlaylist,
    createSpotifyPlaylist,
    deleteGeneratedPlaylist
};