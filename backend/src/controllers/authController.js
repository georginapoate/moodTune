// backend/controllers/authController.js
const SpotifyWebApi = require('spotify-web-api-node');

const scopes = ['playlist-modify-public', 'playlist-modify-private', 'user-read-private', 'user-read-email'];

/**
 * Controller for handling the initial login redirect to Spotify.
 */
const spotifyLogin = (req, res) => {
    const spotifyApi = new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        redirectUri: process.env.SPOTIFY_CALLBACK_URL,
    });

    const authorizeURL = spotifyApi.createAuthorizeURL(scopes);
    res.redirect(authorizeURL);
};

/**
 * Controller for handling the callback from Spotify after user authorization.
 */
const spotifyCallback = async (req, res) => {
    const { code } = req.query;
    
    const spotifyApi = new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        redirectUri: process.env.SPOTIFY_CALLBACK_URL,
    });

    try {
        const data = await spotifyApi.authorizationCodeGrant(code);
        const accessToken = data.body['access_token'];
        const refreshToken = data.body['refresh_token'];
        
        // Redirect the user back to the frontend, passing tokens as query params.
        res.redirect(`http://localhost:3000?access_token=${accessToken}&refresh_token=${refreshToken}`);
    
    } catch (error) {
        console.error('Error during Spotify authorization callback:', error);
        res.status(400).redirect('/#error=spotify_login_failed'); // Redirect to frontend with an error flag
    } 
};

module.exports = {
    spotifyLogin,
    spotifyCallback,
};