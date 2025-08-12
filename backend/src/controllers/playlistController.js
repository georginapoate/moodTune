// backend/controllers/playlistController.js
const { MongoClient } = require('mongodb');
const { getOpenAIEmbedding } = require('../services/openaiService');
const {searchTrackOnSpotify, createPlaylistFromTracks, deletePlaylist } = require('../services/spotifyService');

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = 'moodtunes';
const SONGS_COLLECTION = 'songs';

const generatePlaylist = async (req, res) => {
    const { prompt, accessToken } = req.body;

    if (!prompt || !accessToken) {
        return res.status(400).json({ error: 'A prompt and a Spotify access token are required.' });
    }

    const client = new MongoClient(MONGO_URI);

    try {
        const promptEmbedding = await getOpenAIEmbedding(prompt);
        await client.connect();
        const db = client.db(DB_NAME);
        const collection = db.collection(SONGS_COLLECTION);
        console.log('1. Connected to DB, performing vector search...');

        const searchPipeline = [
            {
                '$vectorSearch': {
                    'index': 'vector_index',
                    'path': 'embedding',
                    'queryVector': promptEmbedding,
                    'numCandidates': 100,
                    'limit': 15
                }
            },
            { '$project': { 'artist': 1, 'title': 1, 'score': { '$meta': 'vectorSearchScore' } } }
        ];
        const recommendedSongs = await collection.aggregate(searchPipeline).toArray();

        if (recommendedSongs.length === 0) {
            return res.status(404).json({ error: 'Could not find any matching songs.' });
        }
        console.log(`2. Found ${recommendedSongs.length} recommended songs.`);

        const results = [];

        for (const doc of recommendedSongs) {
            const spotifyMeta = await searchTrackOnSpotify(accessToken, doc.artist, doc.title);
            results.push({
                artist: doc.artist,
                title: doc.title,
                album: doc.album || null,
                score: doc.score || null,
                spotifyTrackId: spotifyMeta?.spotifyTrackId || null,
                spotifyUri: spotifyMeta?.spotifyUri || null,
                previewUrl: spotifyMeta?.previewUrl || null,
                albumImage: spotifyMeta?.albumImage || null,
                spotifyExternalUrl: spotifyMeta?.spotifyExternalUrl || null,
            });
        }

        return res.json({ songs: results, prompt });

        } catch (error) {
            console.error('An error occurred in the playlist controller:', error);
            if (error.statusCode === 401) {
                return res.status(401).json({ error: 'Spotify token expired.' });
            }
            res.status(500).json({ error: 'Failed to generate playlist.' });
        } finally {
            await client.close();
        }
    };

const savePlaylist = async (req, res) => {
    const { accessToken, songs, prompt } = req.body;
    if (!accessToken || !songs || !prompt) {
        return res.status(400).json({ error: 'Token, songs, and prompt are required.' });
    }
    try {
        const playlistUrl = await createPlaylistFromTracks(accessToken, songs, prompt);
        res.json({ playlistUrl });
    } catch (error) {
       console.error('Error in savePlaylist:', error?.message || error);
        if (error.statusCode === 401) {
            return res.status(401).json({ error: 'Spotify token expired.' });
        }
            return res.status(500).json({ error: 'Failed to create playlist.' });
    }
};

const deleteGeneratedPlaylist = async (req, res) => {
    const { accessToken } = req.body;
    const { playlistId } = req.params;

    if (!accessToken || !playlistId) {
        return res.status(400).json({ error: 'Access token and playlist ID are required.' });
    }

    try {
        await deletePlaylist(accessToken, playlistId);
        res.status(200).json({ message: 'Playlist successfully deleted.' });
    } catch (error) {
        console.error('Error in deleteGeneratedPlaylist controller:', error.message);
        if (error.statusCode === 401) {
            return res.status(401).json({ error: 'Spotify token expired.' });
        }
        res.status(500).json({ error: 'Failed to delete playlist.' });
    }
}

module.exports = {
    generatePlaylist,
    savePlaylist,
    deleteGeneratedPlaylist
};