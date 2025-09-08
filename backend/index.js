// backend/index.js

require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { connectDB } = require('./src/db/connection');

const app = express();
const PORT = process.env.PORT || 5001;

// 1. CORS: Permite cererile de la frontend
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

// 2. Parsere: Folosim cookieParser CU un secret pentru a putea semna cookie-uri
app.use(cookieParser(process.env.COOKIE_SECRET)); // Asigură-te că ai COOKIE_SECRET în .env!
app.use(express.json({ limit: '50mb' }));

// 3. Rutele: Se înregistrează după ce middleware-urile de bază sunt setate
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const playlistRoutes = require('./src/routes/playlistRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/playlist', playlistRoutes);

app.get('/', (req, res) => {
  res.send('Hello World! Backend is up.');
});

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✅ Server is now listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ FATAL: Failed to start the server:", error);
    process.exit(1);
  }
};

startServer();