import { MongoClient, type Db } from 'mongodb';

const DB_NAME = process.env.MONGODB_DB_NAME?.trim() || 'gaulaxmi';

let client: MongoClient | null = null;
let db: Db | null = null;

export function isMongoEnabled(): boolean {
  return Boolean(process.env.MONGODB_URI?.trim());
}

export async function connectMongo(): Promise<Db> {
  if (db) return db;

  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(DB_NAME);
  await db.command({ ping: 1 });
  console.log(`[db] Connected to MongoDB database "${DB_NAME}"`);
  return db;
}

export function getMongoDb(): Db {
  if (!db) {
    throw new Error('MongoDB is not connected');
  }
  return db;
}

export async function disconnectMongo(): Promise<void> {
  await client?.close();
  client = null;
  db = null;
}
