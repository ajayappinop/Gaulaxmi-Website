import { connectMongo, disconnectMongo, isMongoEnabled } from '../mongo.js';
import { JsonStore, loadJsonSnapshotFromDisk } from './jsonStore.js';
import { MongoStore } from './mongoStore.js';
import type { DataStore } from './types.js';

let store: DataStore | null = null;

export async function initStore(): Promise<DataStore> {
  if (store) return store;

  if (isMongoEnabled()) {
    const db = await connectMongo();
    const mongo = new MongoStore(db);
    await mongo.ensureIndexes();

    if (await mongo.isEmpty()) {
      const jsonData = loadJsonSnapshotFromDisk();
      if (jsonData && jsonData.users.length > 0) {
        await mongo.seed(jsonData);
        console.log('[db] Migrated existing JSON data to MongoDB');
      }
    }

    store = mongo;
    console.log('[db] Using MongoDB storage');
  } else {
    const json = new JsonStore();
    json.loadFromDisk();
    store = json;
    console.log('[db] Using JSON file storage (server/data/database.json)');
  }

  return store;
}

export function getStore(): DataStore {
  if (!store) {
    throw new Error('Store not initialized. Call initStore() at startup.');
  }
  return store;
}

export async function closeStore(): Promise<void> {
  await disconnectMongo();
  store = null;
}

export { isMongoEnabled };
