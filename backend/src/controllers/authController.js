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
    
    // Setăm 'state' într-un cookie semnat și securizat
    res.cookie('spotify_auth_state', state, { 
        httpOnly: true, 
        signed: true, // Îi spune lui cookieParser să-l semneze
        secure: true, 
        sameSite: 'none', 
        domain: 'povtunes.space',
        maxAge: 5 * 60 * 1000 // Valabil 5 minute
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
    // 1. Extragem 'code' și 'state' din URL-ul de la Spotify
    const { code, state } = req.query;

    // 2. Extragem 'state'-ul stocat anterior din cookie-urile SEMNATE
    //    'req.signedCookies' este disponibil datorită `cookieParser(secret)` din index.js
    const storedState = req.signedCookies ? req.signedCookies['spotify_auth_state'] : null;

    // 3. Verificarea de securitate. Comparam cele două valori.
    if (!state || !storedState || state !== storedState) {
        // Dacă nu se potrivesc, ștergem cookie-ul invalid și returnăm o eroare.
        res.clearCookie('spotify_auth_state', { domain: 'povtunes.space' });
        return res.status(400).send('State mismatch error. Please try logging in again.');
    }

    // 4. Dacă verificarea a trecut, ștergem cookie-ul temporar. Nu mai este necesar.
    res.clearCookie('spotify_auth_state', { domain: 'povtunes.space' });

    try {
        // 5. Schimbăm 'authorization_code' pentru token-uri de acces
        const { accessToken, refreshToken } = await getSpotifyTokens(
            code,
            process.env.SPOTIFY_CLIENT_ID,
            process.env.SPOTIFY_CLIENT_SECRET,
            process.env.SPOTIFY_CALLBACK_URL
        );
        
        // 6. Obținem profilul utilizatorului de la Spotify
        const spotifyApi = getSpotifyApi(accessToken);
        const meResponse = await spotifyApi.getMe();
        const spotifyProfile = meResponse.body;
        
        // 7. Salvăm sau actualizăm utilizatorul în baza noastră de date
        const user = await findOrCreateUser(spotifyProfile, { accessToken, refreshToken });
        if (!user) {
            throw new Error("Failed to find or create user in the database.");
        }
        
        // 8. Creăm JWT-ul nostru intern pentru a gestiona sesiunea
        const token = jwt.sign(
            { userId: user._id.toString(), spotifyId: user.spotifyId },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // 9. Setăm JWT-ul într-un cookie securizat
        res.cookie('auth_token', token, {
            httpOnly: true, 
            secure: true, 
            sameSite: 'none',
            domain: 'povtunes.space', 
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // 10. Redirecționăm utilizatorul înapoi la frontend
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