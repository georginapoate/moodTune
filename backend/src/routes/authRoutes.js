const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');

const router = express.Router();

// spotify scopes for playlist creation
const scopes = ['playlist-modify-public', 'playlist-modify-private', 'user-read-private', 'user-read-email'];

// sending the user to Spotify's authorization page
router.get('/login', (req, res) => {
    const spotifyApi = new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        redirectUri: process.env.SPOTIFY_CALLBACK_URL,
    });

    const authorizeURL = spotifyApi.createAuthorizeURL(scopes);
    res.redirect(authorizeURL);
});


// the page where they land after logging in
router.get('/callback', async (req, res) => {
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
        const expiresIn = data.body['expires_in'];
        const expiresAt = Date.now() + expiresIn * 1000;   

        // We redirect the user back to our FRONTEND app with the tokens
    res.redirect(`http://localhost:3000?access_token=${accessToken}&refresh_token=${refreshToken}`);
    // tbd: save in database
    } catch (error) {
        console.error('Error during Spotify authorization:', error);
        return res.status(400).json({ error: 'Failed to authorize with Spotify' });
    } 

});

module.exports = router;