// importing express & dotenv

require('dotenv').config(); // This line loads the .env file variables
const express = require('express');

const { getSongsRecommendations } = require('./src/services/openaiService');

const authRoutes = require('./src/routes/authRoutes');

// initializing express app
const app = express();
const port = process.env.PORT || 5001;

app.use(express.json()); // Middleware to parse JSON bodies

app.use('/api/auth', authRoutes); // Use the auth routes

app.post('/api/test-openai', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    const songs = await getSongsRecommendations(prompt);
    
    if (!songs || songs.length === 0) {
      return res.status(404).json({ error: 'No songs found' });
    }
    res.json(songs);
  }
  catch (error) {
    console.error('Error in /api/test-openai:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// simple route to test the server
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});