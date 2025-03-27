import mongoose from 'mongoose';
import { mongodb } from "./config.js";

async function dropSerialNumberIndex() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(mongodb);
    console.log('Connected to database');

    console.log('Dropping serialNumber_1 index from equipment collection...');
    // Get the collection
    const db = mongoose.connection.db;
    const collection = db.collection('equipment');
    
    // List existing indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);
    
    // Find and drop the serialNumber index
    for (const index of indexes) {
      if (index.key && index.key.serialNumber) {
        console.log('Found serialNumber index to drop:', index);
        await collection.dropIndex(index.name);
        console.log('Index dropped successfully');
      }
    }
    
    console.log('Operation complete. Creating new sparse index...');
    
    // Create a new sparse index
    await collection.createIndex({ serialNumber: 1 }, { unique: true, sparse: true });
    console.log('New sparse index created');
    
    console.log('All done! You can now restart your application.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run the function
dropSerialNumberIndex(); 