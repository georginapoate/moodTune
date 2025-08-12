const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = 'moodtunes';
const SONGS_COLLECTION = 'songs';

let client;

async function getDbCollection() {
    if (!client || !client.topology || !client.topology.isConnected()) {
        client = new MongoClient(MONGO_URI);
        await client.connect();
        console.log("New DB Connection established.");
    }
    return client.db(DB_NAME).collection(SONGS_COLLECTION);
}

async function findSimilarSongs(promptEmbedding) {
    const collection = await getDbCollection();

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
    const collection = await getDbCollection();
    await collection.deleteMany({});
    console.log('> Cleared existing songs from the collection.');

    if (songDocuments.length > 0) {
        await collection.insertMany(songDocuments);
        console.log(`> Successfully inserted ${songDocuments.length} songs into the database.`);
    }
}

async function closeDbConnection() {
    if (client && client.topology && client.topology.isConnected()) {
        await client.close();
        console.log("DB Connection closed.");
    }
}


module.exports = {
    // getDbCollection,
    findSimilarSongs,
    seedSongsCollection,
    closeDbConnection
}