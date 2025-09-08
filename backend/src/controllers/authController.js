// backend/controllers/authController.js
const SpotifyWebApi = require('spotify-web-api-node');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { findOrCreateUser, findUserById } = require('../services/dbService');
const { getSpotifyApi } = require('../services/spotifyService');
const { encrypt, decrypt } = require('../../utils/crypto');

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
    
    // // Setăm 'state' într-un cookie semnat și securizat
    // res.cookie('spotify_auth_state', state, { 
    //     httpOnly: true, 
    //     signed: true, // Îi spune lui cookieParser să-l semneze
    //     secure: true, 
    //     sameSite: 'none', 
    //     domain: 'povtunes.space',
    //     maxAge: 5 * 60 * 1000 // Valabil 5 minute
    // });

    const encryptedState = encrypt(state);

    // 3. Stocăm obiectul criptat (IV + conținut) ca un string JSON, apoi îl encodăm pentru URL
    const stateParam = Buffer.from(JSON.stringify(encryptedState)).toString('base64');
    const authorizeURL = createSpotifyAuthorizeURL(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CALLBACK_URL, scopes, stateParam);
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
    const { code, state: stateParam } = req.query;

    if (!stateParam) {
        return res.status(400).send('State parameter is missing.');
    }

    try {
        // 1. Decodăm 'state'-ul primit de la Spotify
        const encryptedState = JSON.parse(Buffer.from(stateParam, 'base64').toString('ascii'));
        
        // 2. DECRIPTĂM state-ul folosind cheia noastră secretă
        const decryptedState = decrypt(encryptedState);

        // --- Fluxul continuă normal de aici ---
        const { accessToken, refreshToken } = await getSpotifyTokens(
            code,
            process.env.SPOTIFY_CLIENT_ID,
            process.env.SPOTIFY_CLIENT_SECRET,
            process.env.SPOTIFY_CALLBACK_URL
        );
        
        const spotifyApi = getSpotifyApi(accessToken);
        const meResponse = await spotifyApi.getMe();
        const spotifyProfile = meResponse.body;
        
        const user = await findOrCreateUser(spotifyProfile, { accessToken, refreshToken });
        if (!user) throw new Error("Failed to find or create user.");
        
        const token = jwt.sign(
            { userId: user._id.toString(), spotifyId: user.spotifyId },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('auth_token', token, {
            httpOnly: true, secure: true, sameSite: 'none',
            domain: 'povtunes.space', maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.redirect(process.env.FRONTEND_URL);

    } catch (error) {
    const errorMessage = (error.body && typeof error.body === 'string' ? error.body : JSON.stringify(error.body)) || error.message || '';
        if (errorMessage.includes('invalid_grant') || errorMessage.includes('Authorization code expired or has already been used')) {
            console.warn('Authorization code was likely already used by a browser pre-fetch. Redirecting user to frontend assuming success.');
            // Presupunem că prima cerere a avut succes și a setat cookie-ul.
            // Doar redirecționăm utilizatorul la frontend.
            return res.redirect(process.env.FRONTEND_URL);
        }

        // Gestionăm alte erori posibile
        if (error.message && error.message.includes('bad decrypt')) {
            return res.status(400).send('Invalid state parameter. CSRF attempt detected.');
        }

        console.error('\nAn unhandled error occurred during Spotify callback:', error);
        res.status(500).send(`<h1>Error authenticating</h1><p>${error.body || error.message || 'An unknown error occurred.'}</p>`);
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
    res.clearCookie('auth_token', { 
        domain: 'povtunes.space',
        // httpOnly: true,
        // secure: true,
        // sameSite: 'none'
    });

    res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = {
    spotifyLogin,
    spotifyCallback,
    getPlayerToken,
    refreshToken,
    logout
};