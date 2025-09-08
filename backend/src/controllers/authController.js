// backend/controllers/authController.js
const SpotifyWebApi = require('spotify-web-api-node');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { findOrCreateUser, findUserById } = require('../services/dbService');
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
    
    // Setăm 'state' într-un cookie semnat și httpOnly
    res.cookie('spotify_auth_state', state, { 
        httpOnly: true, 
        signed: true, // Asta îi spune lui cookieParser să-l semneze
        secure: true, 
        sameSite: 'none', 
        domain: 'povtunes.space'
    });

    const authorizeURL = createSpotifyAuthorizeURL(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CALLBACK_URL, scopes, state);
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
    // Citim 'state' din cookie-urile SEMNATE.
    const storedState = req.signedCookies ? req.signedCookies['spotify_auth_state'] : null;

    if (!state || state !== storedState) {
        // Dacă eșuează, ștergem cookie-ul pentru a curăța
        res.clearCookie('spotify_auth_state', { domain: 'povtunes.space' });
        return res.status(400).send('State mismatch error. Please try logging in again.');
    }

    // Curățăm cookie-ul, nu mai este necesar
    res.clearCookie('spotify_auth_state', { domain: 'povtunes.space' });

    try {
        const { accessToken, refreshToken } = await getSpotifyTokens(/* ... */);
        const spotifyApi = getSpotifyApi(accessToken);
        const meResponse = await spotifyApi.getMe();
        const spotifyProfile = meResponse.body;
        
        const user = await findOrCreateUser(spotifyProfile, { accessToken, refreshToken });
        if (!user) throw new Error("Failed to find or create user.");
        
        const token = jwt.sign(
            { userId: user._.toString(), spotifyId: user.spotifyId },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('auth_token', token, {
            httpOnly: true, secure: true, sameSite: 'none',
            domain: 'povtunes.space', maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.redirect(process.env.FRONTEND_URL);

    } catch (error) {
        console.error('\nError during Spotify callback:', error.body || error.message);
        res.status(500).send(`<h1>Error authenticating</h1><p>${error.message || 'An unknown error occurred.'}</p>`);
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

const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).json({ message: 'Server error' });
        }
        res.clearCookie('auth_token', { domain: 'povtunes.space' });
        res.status(200).json({ message: 'Logged out successfully' });
    });
};

module.exports = {
    spotifyLogin,
    spotifyCallback,
    getPlayerToken,
    refreshToken,
    logout
};