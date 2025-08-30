// backend/src/db/connection.js
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = 'moodtunes';

let client;
let db;


const connectDB = async () => {
  if (db) {
    return; // Already connected
  }
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log("MongoDB connection established successfully.");
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
};


const getDb = () => {
  if (!db) {
    throw new Error("Database not connected. Call connectDB first.");
  }
  return db;
};


const closeDbConnection = async () => {
  if (client) {
    await client.close();
    console.log("MongoDB connection closed.");
  }
};

module.exports = { connectDB, getDb, closeDbConnection };