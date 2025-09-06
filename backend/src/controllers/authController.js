// backend/controllers/authController.js
const SpotifyWebApi = require('spotify-web-api-node');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { findOrCreateUser, findUserById} = require('../services/dbService');
const { getSpotifyApi } = require('../services/spotifyService');
const { decrypt } = require('../../utils/crypto');

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
    const state = crypto.randomBytes(16).toString('hex');
    
    req.session.spotify_auth_state = state;

    // res.cookie('spotify_auth_state', state, { httpOnly: true});
    const authorizeURL = createSpotifyAuthorizeURL(SPOTIFY_CLIENT_ID, SPOTIFY_CALLBACK_URL, scopes, state);
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
    const { code, state } = req.query;
    // const storedState = req.cookies ? req.cookies['spotify_auth_state'] : null;
    const storedState = req.session ? req.session.spotify_auth_state : null;

    if (state === null || state !== storedState) {
        return res.status(400).send('State mismatch');
    }
    res.clearCookie('spotify_auth_state');

    if (!code) {
        return res.status(400).send('Spotify authorization code is missing.');
    }
    try {
        console.log('\n--- Spotify Callback Received ---');
        const { accessToken, refreshToken } = await getSpotifyTokens(
            code, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_CALLBACK_URL
        )

        const spotifyApi = getSpotifyApi(accessToken);

        const meResponse = await spotifyApi.getMe();
        const spotifyProfile = await meResponse.body;

        console.log('Successfully fetched Spotify profile:', spotifyProfile);

        const user = await findOrCreateUser(spotifyProfile, { accessToken, refreshToken });
        console.log("User document received in controller:", user);
        if (!user) {
            throw new Error("Failed to find or create user in the database.");
        }


        const token = jwt.sign(
            { userId: user._id.toString(), spotifyId: user.spotifyId },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        res.redirect(process.env.FRONTEND_URL || `http://127.0.0.1:3000/`);

    } catch (error) {

        console.error('\nError from Spotify API (body):', error.body);

        res.status(500).send(`
                <h1>Error authenticating</h1>
                <p><b>Error from Spotify:</b> ${error.body ? JSON.stringify(error.body) : error.message}</p>
            `);
    }
};

const getPlayerToken = async (req, res) => {
  try {
    const user = await findUserById(req.userId); // req.userId comes from our 'protect' middleware
    if (!user || !user.accessToken) {
      return res.status(404).json({ message: 'User or token not found' });
    }
    const accessToken = decrypt(user.accessToken);
    res.json({ accessToken });
  } catch (error) {
    console.error("Error fetching player token:", error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
    spotifyLogin,
    spotifyCallback,
    getPlayerToken,
    refreshToken
};