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
try {
        const user = await findUserById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Inițializăm token-ul și API-ul. Folosim 'let' pentru a le putea modifica ulterior.
        let accessToken = decrypt(user.accessToken);
        let spotifyApi = getSpotifyApi(accessToken);

        // --- ÎNCAPSULĂM LOGICA DE GENERARE PENTRU A O PUTEA REÎNCERCA ---
        const performGeneration = async () => {
            console.log("1. Generating embedding for prompt...");
            const promptEmbedding = await getOpenAIEmbedding(prompt);
            const recommendedSongs = await findSimilarSongs(promptEmbedding);

            if (recommendedSongs.length === 0) {
                // Returnăm un obiect special pentru a fi gestionat mai jos, nu un răspuns HTTP direct
                return { error: 'Could not find any matching songs.', status: 404 };
            }
            console.log(`2. Found ${recommendedSongs.length} recommended songs.`);

            const results = [];
            console.log(`3. Fetching Spotify metadata for each song...`);
            for (const doc of recommendedSongs) {
                // Aici poate apărea eroarea de token expirat
                const spotifyMeta = await searchTrackOnSpotify(spotifyApi, doc.artist, doc.title);
                results.push({
                    artist: doc.artist, title: doc.title, album: doc.album, score: doc.score,
                    spotifyTrackId: spotifyMeta?.spotifyTrackId || null,
                    spotifyUri: spotifyMeta?.spotifyUri || null,
                    previewUrl: spotifyMeta?.previewUrl || null,
                    albumImage: spotifyMeta?.albumImage || null,
                    spotifyExternalUrl: spotifyMeta?.spotifyExternalUrl || null,
                });
            }
            // Returnăm rezultatele complete pentru a fi procesate mai departe
            return { songs: results, originalSongs: recommendedSongs };
        };
        // --- SFÂRȘITUL FUNCȚIEI ÎNCAPSULATE ---


        let generationResult;
        try {
            // Încercăm să generăm playlist-ul prima dată
            generationResult = await performGeneration();
        } catch (err) {
            // Verificăm DACĂ eroarea este specifică unui token expirat (status 401)
            if (err.body?.error?.status === 401) {
                console.log("Access token expired. Attempting to refresh...");
                
                const refreshToken = decrypt(user.refreshToken);
                const data = await refreshAccessToken(refreshToken, process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET);
                const newAccessToken = data.accessToken;

                // CRUCIAL: Actualizăm token-ul nou, criptat, în baza de date pentru utilizări viitoare
                await getDb().collection('users').updateOne(
                    { _id: user._id },
                    { $set: { accessToken: encrypt(newAccessToken) } }
                );

                // Actualizăm instanța API cu noul token și reîncercăm generarea
                spotifyApi.setAccessToken(newAccessToken);
                console.log("Token refreshed successfully. Retrying playlist generation...");
                generationResult = await performGeneration();
            } else {
                // Dacă este orice alt tip de eroare, o aruncăm pentru a fi prinsă de blocul catch principal
                throw err;
            }
        }

        // Verificăm dacă funcția de generare a returnat o eroare controlată (ex: nicio melodie găsită)
        if (generationResult.error) {
            return res.status(generationResult.status).json({ error: generationResult.error });
        }
        
        // De-duplicarea și salvarea în istoric se fac pe rezultatul final, reușit
        const uniqueResults = Array.from(new Map(generationResult.songs.filter(s => s.spotifyTrackId).map(s => [s.spotifyTrackId, s])).values());
        
        if (uniqueResults.length > 0) {
            const songIds = generationResult.originalSongs.map(song => new ObjectId(song._id));
            await savePromptToHistory(req.userId, prompt, songIds);
        }

        console.log(`4. Returning ${uniqueResults.length} unique songs to frontend.`);
        return res.json({ songs: uniqueResults, prompt });

    } catch (error) {
        // Acest bloc prinde erorile critice (ex: eșec la reînnoire, probleme cu DB etc.)
        console.error('A critical error occurred in the playlist controller:', error.body || error);
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