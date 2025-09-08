// backend/index.js

// Load environment variables FIRST
require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const MongoStore = require('connect-mongo');
const { connectDB } = require('./src/db/connection');
// const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 5001;

// app.use((req, res, next) => {
//   console.log(`\n--- Request: ${req.method} ${req.originalUrl} ---`);
//   next();
// });

// Configure CORS to allow requests from your frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://127.0.0.1:3000',
  credentials: true,
}));

app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.json({ limit: '50mb' }));

const mongoUrl = process.env.MONGO_URI;
if (!mongoUrl) {
  throw new Error("❌ FATAL: MONGO_URI is not defined in environment variables.");
}

app.use(session({
  secret: process.env.SESSION_SECRET, // Adaugă o variabilă SESSION_SECRET în .env!
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl,
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60 // 14 days
  }),
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: 'none',
    domain: 'povtunes.space', // Opțional, dar bun pentru consistență
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));



// --- ROUTES SETUP ---
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const playlistRoutes = require('./src/routes/playlistRoutes');

app.use('/api/auth', authRoutes);
console.log("Attempting to register user routes for the '/api/users' path...");
app.use('/api/users', userRoutes);
console.log("User routes should now be registered.");
app.use('/api/playlist', playlistRoutes);

// A simple root route to check if the server is up
app.get('/', (req, res) => {
  res.send('Hello World! Backend is up.');
});

const startServer = async () => {
  console.log("Attempting to start the server...");
  try {
    console.log("Connecting to the database...");
    await connectDB();
    console.log("Database connection successful. Starting Express server...");

    app.listen(PORT, () => {
      console.log(`✅ Server is now listening on port ${PORT}`);
      console.log("Ready to accept requests.");
    });

  } catch (error) {
    console.error("❌ FATAL: Failed to start the server:", error);
    process.exit(1);
  }
};

startServer();
