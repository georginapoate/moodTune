// backend/controllers/authController.js
const SpotifyWebApi = require('spotify-web-api-node');

const scopes = ['playlist-modify-public', 'playlist-modify-private', 'user-read-private', 'user-read-email'];

const spotifyLogin = (req, res) => {
    const spotifyApi = new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        redirectUri: process.env.SPOTIFY_CALLBACK_URL,
    });
    const authorizeURL = spotifyApi.createAuthorizeURL(scopes);
    res.redirect(authorizeURL);
};

const spotifyCallback = async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send('Spotify authorization code is missing.');
    }
    
    const spotifyApi = new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        redirectUri: process.env.SPOTIFY_CALLBACK_URL,
    });

    try {
        console.log('\n--- Spotify Callback Received ---');
        const data = await spotifyApi.authorizationCodeGrant(code);
        
        const accessToken = data.body['access_token'];
        const refreshToken = data.body['refresh_token'];
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
};