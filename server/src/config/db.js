const mongoose = require('mongoose');

let mongod = null;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/timewise';
  
  try {
    console.log(`[Database] Attempting connection to MongoDB at: ${uri}`);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    const { autoSeedIfEmpty } = require('../seed/seedData');
    await autoSeedIfEmpty();
    return conn;
  } catch (error) {
    console.warn(`[Database] Could not connect to external MongoDB: ${error.message}`);
    console.log('[Database] Starting in-memory MongoDB server for development/demo mode...');
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      
      const conn = await mongoose.connect(memoryUri);
      console.log(`[Database] In-Memory MongoDB Connected at: ${memoryUri}`);
      
      // Auto seed initial data if running in-memory
      const { autoSeedIfEmpty } = require('../seed/seedData');
      await autoSeedIfEmpty();
      
      return conn;
    } catch (memErr) {
      console.error('[Database] Failed to start in-memory MongoDB:', memErr.message);
      process.exit(1);
    }
  }
};

const closeDB = async () => {
  await mongoose.connection.close();
  if (mongod) {
    await mongod.stop();
  }
};

module.exports = { connectDB, closeDB };
