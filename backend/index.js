// backend/index.js

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5001;
const host = '127.0.0.1';

app.use((req, res, next) => {
  console.log(`\n--- Request: ${req.method} ${req.originalUrl} ---`);
  next();
});

app.use(cors()); 
app.use(express.json());

const authRoutes = require('./src/routes/authRoutes');
const playlistRoutes = require('./src/routes/playlistRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/playlist', playlistRoutes);


app.get('/', (req, res) => {
  res.send('Hello World! Backend is up.');
});

app.listen(port, host, () => {
  console.log(`Backend server is running on http://${host}:${port}`);
});