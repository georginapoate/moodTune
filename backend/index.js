// importing express & dotenv

require('dotenv').config(); // This line loads the .env file variables
const express = require('express');

const { getSongsRecommendations } = require('./src/services/openaiService');

const authRoutes = require('./src/routes/authRoutes');
const playlistRoutes = require('./src/routes/playlistRoutes');

// initializing express app
const app = express();
const port = process.env.PORT || 5001;

app.use(express.json()); // Middleware to parse JSON bodies

app.use('/api/auth', authRoutes); // Use the auth routes
// app.use('/', );

app.use('/api/playlist', playlistRoutes); // Use the playlist routes

// simple route to test the server
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});