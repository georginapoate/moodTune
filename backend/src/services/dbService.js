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
    const usersCollection = getDb().collection(USERS_COLLECTION);
    const { id: spotifyId, display_name, email, images, product, followers } = spotifyProfile;

    try {
        await usersCollection.createIndex({ spotifyId: 1 }, { unique: true });
    } catch (indexError) {
        // Ignorăm eroarea, cel mai probabil indexul există deja
    }

    const encryptedAccessToken = encrypt(tokens.accessToken);
    const newEncryptedRefreshToken = tokens.refreshToken ? encrypt(tokens.refreshToken) : existingUser?.refreshToken || null;

    console.log(`Searching for user with Spotify ID: ${spotifyId}`);
    const existingUser = await usersCollection.findOne({ spotifyId: spotifyId });

    if (existingUser) {
        console.log(`User found: ${existingUser.displayName}. Updating profile and tokens.`);
        
        // 1. Construim dinamic obiectul de actualizare
        const updateFields = {
            accessToken: encryptedAccessToken,
            displayName: display_name,
            profileImageUrl: images?.[0]?.url || null,
            product: product,
            followers: followers,
        };

        // 2. Adăugăm refreshToken DOAR dacă am primit unul nou de la Spotify
        if (newEncryptedRefreshToken) {
            updateFields.refreshToken = newEncryptedRefreshToken;
            console.log('  - A new refresh token was provided. Updating it.');
        } else {
            console.log('  - No new refresh token provided. Keeping the old one.');
        }

        // 3. Executăm actualizarea o singură dată
        await usersCollection.updateOne(
            { _id: existingUser._id },
            { $set: updateFields }
        );
        
        // 4. Returnăm documentul complet actualizat din baza de date
        return usersCollection.findOne({ _id: existingUser._id });
    
    } else {
        console.log(`User not found. Creating new user: ${display_name}`);
        
        const newUserDocument = {
            spotifyId: spotifyId,
            displayName: display_name,
            email: email,
            profileImageUrl: images?.[0]?.url || null,
            product: product,
            followers: followers,
            accessToken: encryptedAccessToken,
            refreshToken: newEncryptedRefreshToken, // Aici e ok să fie null dacă nu a fost primit
            createdAt: new Date(),
        };

        const insertResult = await usersCollection.insertOne(newUserDocument);
        
        if (insertResult.insertedId) {
            console.log(`Successfully created new user with DB ID: ${insertResult.insertedId}`);
            return { ...newUserDocument, _id: insertResult.insertedId };
        } else {
            console.error("!!! CRITICAL: Failed to insert new user into the database. !!!");
            return null;
        }
    }
}

async function findUserById(userId) {
  const usersCollection = await getDb().collection(USERS_COLLECTION);
  return usersCollection.findOne({ _id: new ObjectId(userId) });
}

async function savePromptToHistory(userId, promptText, songIds) {
  try {
    const promptsCollection = getDb().collection('prompts');
    await promptsCollection.insertOne({
      userId: new ObjectId(userId),
      promptText: promptText,
      generatedSongIds: songIds,
      createdAt: new Date()
    });
    console.log(`Successfully saved prompt history for user ${userId}`);
  } catch (error) {
    console.error("Error saving prompt to history:", error);
  }
}


module.exports = {
    findSimilarSongs,
    seedSongsCollection,
    savePromptToHistory,
    findOrCreateUser,
    findUserById,
}