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

const setToken = (req, res) => {
  const { token } = req.body
  if (!token) return res.status(400).json({ error: "Missing token" })

  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    domain: "povtunes.space",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })

  res.json({ success: true })
}


const spotifyCallback = async (req, res) => {
  const { code, state: stateParam } = req.query;

  if (!stateParam) {
    return res.status(400).send('State parameter is missing.');
  }

  try {
    // Decode & decrypt state
    const encryptedState = JSON.parse(
      Buffer.from(stateParam, 'base64').toString('ascii')
    );
    const decryptedState = decrypt(encryptedState);

    // Exchange code for tokens
    const { accessToken, refreshToken } = await getSpotifyTokens(
      code,
      process.env.SPOTIFY_CLIENT_ID,
      process.env.SPOTIFY_CLIENT_SECRET,
      process.env.SPOTIFY_CALLBACK_URL
    );

    // Get user profile
    const spotifyApi = getSpotifyApi(accessToken);
    const meResponse = await spotifyApi.getMe();
    const spotifyProfile = meResponse.body;

    // Create / update user in DB
    const user = await findOrCreateUser(spotifyProfile, { accessToken, refreshToken });
    if (!user) throw new Error("Failed to find or create user.");

    // JWT for our app
    const token = jwt.sign(
      { userId: user._id.toString(), spotifyId: user.spotifyId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: 'povtunes.space',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Redirect with token fallback (in case cookie was eaten by prefetch)
    return res.redirect(`${process.env.FRONTEND_URL}?token=${token}`);
  } catch (error) {
    const errorBody = error.body || {};
    const errorMsg = errorBody.error_description || error.message || "Unknown error";

    // Handle double-usage of code (prefetch)
    if (
      errorMsg.includes('invalid_grant') ||
      errorMsg.includes('Authorization code expired') ||
      errorMsg.includes('already been used')
    ) {
      console.warn('⚠️ Code already used. Redirecting user to frontend assuming session is valid.');
      return res.redirect(process.env.FRONTEND_URL);
    }

    console.error("❌ Spotify callback error:", {
      status: error.statusCode,
      body: error.body,
      message: error.message,
    });

    return res.status(500).send(
      `<h1>Error authenticating</h1><pre>${errorMsg}</pre>`
    );
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
    setToken,
    logout
};