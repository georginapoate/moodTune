// backend/controllers/authController.js
const SpotifyWebApi = require('spotify-web-api-node');

const scopes = ['streaming', 'user-read-playback-state', 'user-modify-playback-state', 'playlist-modify-public', 'playlist-modify-private', 'user-read-private', 'user-read-email'];

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_CALLBACK_URL = process.env.SPOTIFY_CALLBACK_URL
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET

const {
    createSpotifyAuthorizeURL,
    getSpotifyTokens,
    refreshAccessToken,
} = require('../services/spotifyService')

const spotifyLogin = (req, res) => {
    const authorizeURL = createSpotifyAuthorizeURL(SPOTIFY_CLIENT_ID, SPOTIFY_CALLBACK_URL, scopes);
    res.redirect(authorizeURL);
};

const refreshToken = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: 'Missing refresh token' });
    }

    try {
        const { accessToken, expiresIn } = await refreshAccessToken(
            refreshToken,
            SPOTIFY_CLIENT_ID,
            SPOTIFY_CLIENT_SECRET
        );

        return res.json({ accessToken, expiresIn });
    } catch (error) {
        console.error('Error refreshing token:', error.message);
        return res.status(500).json({ error: 'Failed to refresh token' });
    }
}

const spotifyCallback = async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send('Spotify authorization code is missing.');
    }
    try {
        console.log('\n--- Spotify Callback Received ---');
        const { accessToken, refreshToken } = await getSpotifyTokens(
            code, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_CALLBACK_URL
        )
        res.redirect(`http://127.0.0.1:3000?access_token=${accessToken}&refresh_token=${refreshToken}`);

    } catch (error) {

        console.error('\nError from Spotify API (body):', error.body);

        res.status(500).send(`
                <h1>Error authenticating</h1>
                <p><b>Error from Spotify:</b> ${error.body ? JSON.stringify(error.body) : error.message}</p>
            `);
    }
};


module.exports = {
    spotifyLogin,
    spotifyCallback,
    refreshToken
};