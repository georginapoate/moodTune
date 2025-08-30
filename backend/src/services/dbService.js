const { MongoClient, ObjectId } = require('mongodb');
const { encrypt } = require('../../utils/crypto');
const { getDb } = require('../db/connection');

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = 'moodtunes';
const SONGS_COLLECTION = 'songs';
const USERS_COLLECTION = 'users';

let client;


async function findSimilarSongs(promptEmbedding) {
    const collection = await getDb().collection(SONGS_COLLECTION);

    const searchPipeline = [
        {
            '$vectorSearch': {
                'index': 'vector_index',
                'path': 'embedding',
                'queryVector': promptEmbedding,
                'numCandidates': 100,
                'limit': 15
            }
        },
        {
            '$project': {
                'artist': 1,
                'title': 1,
                'album': 1,
                'score': { '$meta': 'vectorSearchScore' }
            }
        }
    ];

    return collection.aggregate(searchPipeline).toArray();
}

async function seedSongsCollection(songDocuments) {

    if (!songDocuments || songDocuments.length === 0) {
        console.log(`> No song documents provided to seed. Stopping the seed process.`);
        return;
    }

    const collection = await getDb().collection(SONGS_COLLECTION);
    console.log('> Seeding songs collection...');

    try {
        await collection.createIndex({ artist: 1, title: 1 }, { unique: true });
        console.log('  - Ensured unique index on { artist, title } exists.');
    } catch (indexError) {
        console.error('! Error creating unique index:', indexError.message);
        return;
    }

    const operations = songDocuments.map(doc => ({
        updateOne: {
        filter: { artist: doc.artist, title: doc.title }, 
        update: { $set: doc },
        upsert: true,
        },
    }));

    try {
        const result = await collection.bulkWrite(operations);
        console.log('> Bulk upsert operation complete.');
        console.log(`  - Songs freshly inserted: ${result.upsertedCount}`);
        console.log(`  - Existing songs updated: ${result.modifiedCount}`);
        console.log(`  - Total songs matched: ${result.matchedCount}`);
    } catch (error) {
        console.error('! An error occurred during the bulk write operation:', error);
    }
}

async function findOrCreateUser(spotifyProfile, tokens) {
  const usersCollection = await getDb().collection(USERS_COLLECTION);

  const { id, display_name, email, images } = spotifyProfile;

  // Encrypt tokens, as this happens in both update and create scenarios
  const encryptedAccessToken = encrypt(tokens.accessToken);
  const encryptedRefreshToken = encrypt(tokens.refreshToken);

  console.log(`Searching for user with Spotify ID: ${id}`);
  const existingUser = await usersCollection.findOne({ spotifyId: id });

  if (existingUser) {
    // --- SCENARIO 1: USER EXISTS ---
    console.log(`User found: ${existingUser.displayName}. Updating tokens.`);
    
    await usersCollection.updateOne(
      { _id: existingUser._id },
      {
        $set: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          displayName: display_name,
          profileImageUrl: images?.[0]?.url || null,
        }
      }
    );
    
    return { ...existingUser, accessToken: encryptedAccessToken, refreshToken: encryptedRefreshToken };
  
  } else {
    console.log(`User not found. Creating new user: ${display_name}`);
    
    const newUserDocument = {
      spotifyId: id,
      displayName: display_name,
      email: email,
      profileImageUrl: images?.[0]?.url || null,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      createdAt: new Date(),
    };

    const insertResult = await usersCollection.insertOne(newUserDocument);
    
    if (insertResult.insertedId) {
      console.log(`Successfully created new user with DB ID: ${insertResult.insertedId}`);
      return newUserDocument;
    } else {
      console.error("!!! CRITICAL: Failed to insert new user into the database. !!!");
      return null; // Return null if the insert operation fails
    }
  }
}

async function findUserById(userId) {
  const usersCollection = await getDb().collection(USERS_COLLECTION);
  // We need to convert the string ID to a MongoDB ObjectId
  return usersCollection.findOne({ _id: new ObjectId(userId) });
}


module.exports = {
    findSimilarSongs,
    seedSongsCollection,
    findOrCreateUser,
    findUserById,
}