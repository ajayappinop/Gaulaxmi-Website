import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ContactInquiry, DbUser, InvestmentPlan, MilestoneTier } from '../shared/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = path.join(__dirname, 'data');

export interface Database {
  users: DbUser[];
  plans: InvestmentPlan[];
  milestones: MilestoneTier[];
  inquiries: ContactInquiry[];
}

const DB_FILE = path.join(DATA_DIR, 'database.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readDb(): Database {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    return { users: [], plans: [], milestones: [], inquiries: [] };
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Database;
    return {
      users: parsed.users ?? [],
      plans: parsed.plans ?? [],
      milestones: parsed.milestones ?? [],
      inquiries: parsed.inquiries ?? [],
    };
  } catch {
    return { users: [], plans: [], milestones: [], inquiries: [] };
  }
}

export function writeDb(db: Database): void {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

export function updateDb(mutator: (db: Database) => void): Database {
  const db = readDb();
  mutator(db);
  writeDb(db);
  return db;
}
