// backend/controllers/playlistController.js
const { MongoClient } = require('mongodb');
const { getOpenAIEmbedding } = require('../services/openaiService');
const SpotifyWebApi = require('spotify-web-api-node');

const generatePlaylist = async (req, res) => {
    const { prompt, accessToken } = req.body;

    if (!prompt || !accessToken) {
        return res.status(400).json({ error: 'A prompt and a Spotify access token are required.' });
    }

    const client = new MongoClient(process.env.MONGO_URI);

    try {
        // --- Steps 1 & 2: Get recommendations ---
        const promptEmbedding = await getOpenAIEmbedding(prompt);
        await client.connect();
        const db = client.db('moodtunes');
        const collection = db.collection('songs');
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
        console.log(`2. Found ${recommendedSongs.length} recommended songs.`);

        // --- Steps 3-6: Spotify Logic ---
        const spotifyApi = new SpotifyWebApi({ accessToken });
        const trackUris = [];
        for (const song of recommendedSongs) {
            const searchResult = await spotifyApi.searchTracks(`track:${song.title} artist:${song.artist}`, { limit: 1 });
            if (searchResult.body.tracks.items.length > 0) {
                trackUris.push(searchResult.body.tracks.items[0].uri);
            }
        }
        
        if (trackUris.length === 0) throw new Error('Could not find any tracks on Spotify.');

        const me = await spotifyApi.getMe();
        const playlist = await spotifyApi.createPlaylist(`MoodTunes: ${prompt.substring(0, 50)}`, { public: false });
        await spotifyApi.addTracksToPlaylist(playlist.body.id, trackUris);
        
        console.log('7. Done! Playlist created.');
        res.json({ playlistUrl: playlist.body.external_urls.spotify });

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

module.exports = {
    generatePlaylist,
};