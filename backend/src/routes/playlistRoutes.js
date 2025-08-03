// backend/routes/playlistRoutes.js
const express = require('express');
const { MongoClient } = require('mongodb');
const { getOpenAIEmbedding } = require('../services/openaiService');
// We will need the Spotify service in the next step, but let's import it now.
const SpotifyWebApi = require('spotify-web-api-node');

const router = express.Router();

// The main endpoint for our app
router.post('/generate', async (req, res) => {
    // We will eventually need an accessToken, but for now, just the prompt.
    const { prompt /*, accessToken */ } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'A prompt is required.' });
    }

    const client = new MongoClient(process.env.MONGO_URI);

    try {
        // --- Step 1: Convert the user's prompt into an embedding vector ---
        console.log(`1. Generating embedding for prompt: "${prompt}"`);
        const promptEmbedding = await getOpenAIEmbedding(prompt);

        if (!promptEmbedding) {
            return res.status(500).json({ error: 'Could not generate embedding for the prompt.' });
        }

        // --- Step 2: Connect to MongoDB and perform the vector search ---
        await client.connect();
        const db = client.db('moodtunes');
        const collection = db.collection('songs');
        console.log('2. Connected to DB, performing vector search...');

        const searchPipeline = [
            {
                '$vectorSearch': {
                    'index': 'vector_index', // The name of your vector search index
                    'path': 'embedding', // The field that contains the vectors
                    'queryVector': promptEmbedding, // The vector we want to search for
                    'numCandidates': 100, // Number of candidates to consider
                    'limit': 15 // Number of results to return
                }
            },
            {
                // This stage adds a 'score' field to the results
                '$project': {
                    'artist': 1,
                    'title': 1,
                    'album': 1,
                    'score': { '$meta': 'vectorSearchScore' }
                }
            }
        ];

        const similarSongs = await collection.aggregate(searchPipeline).toArray();
        console.log(`3. Found ${similarSongs.length} similar songs.`);

        if (similarSongs.length === 0) {
            return res.status(404).json({ error: 'Could not find any matching songs for that vibe. Try something else!' });
        }

        // --- Step 3: For now, just return the list of songs ---
        // In the next step, we will use these songs to create a Spotify playlist.
        res.json({ recommendedSongs: similarSongs });

    } catch (error) {
        console.error('An error occurred in the /generate route:', error);
        res.status(500).json({ error: 'Failed to generate recommendations.' });
    } finally {
        await client.close();
    }
});

module.exports = router;