import fs from 'fs';
import { readDb, writeDb, DATA_DIR } from './db.js';
import { buildSeedDatabase } from './seed.js';
import { DEFAULT_PLANS } from './defaultPlans.js';
import { DEFAULT_MILESTONES } from './defaultMilestones.js';
import { backfillKycHistory } from './services/kycHistory.js';

export async function initDb(): Promise<void> {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const db = readDb();
  let changed = false;

  if (db.users.length === 0) {
    const seed = await buildSeedDatabase();
    writeDb(seed);
    console.log('[db] Seeded users, plans, and milestones');
    return;
  }

  if (db.plans.length === 0) {
    db.plans = [...DEFAULT_PLANS];
    changed = true;
  }
  if (db.milestones.length === 0) {
    db.milestones = [...DEFAULT_MILESTONES];
    changed = true;
  }
  if (changed) {
    writeDb(db);
    console.log('[db] Filled missing plans/milestones');
  }

  let migrated = 0;
  for (const u of db.users) {
    const before = u.kycHistory?.length ?? 0;
    backfillKycHistory(u);
    if ((u.kycHistory?.length ?? 0) > before) migrated++;
  }
  if (migrated > 0) {
    writeDb(db);
    console.log(`[db] Backfilled KYC history for ${migrated} user(s)`);
  }
}
