import fs from 'fs';
import { readDb, writeDb, DATA_DIR } from './db.js';
import { buildSeedDatabase } from './seed.js';
import { DEFAULT_PLANS } from './defaultPlans.js';
import { DEFAULT_MILESTONES } from './defaultMilestones.js';
import { backfillKycHistory } from './services/kycHistory.js';
import { ensurePaymentSettings } from './services/paymentSettings.js';
import { DEFAULT_PAYMENT_SETTINGS } from './defaultPaymentSettings.js';
import {
  ALL_ADMIN_PERMISSIONS,
  SUPER_ADMIN_EMAILS,
  normalizeAdminEmail,
} from '../shared/adminPermissions.js';

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

  const fresh = readDb();
  let paymentChanged = false;
  if (!fresh.paymentSettings) {
    fresh.paymentSettings = {
      ...DEFAULT_PAYMENT_SETTINGS,
      updatedAt: new Date().toISOString(),
    };
    if (!fresh.depositSettings) {
      fresh.depositSettings = fresh.paymentSettings.deposits;
    }
    paymentChanged = true;
  }
  if (!fresh.depositRequests) {
    fresh.depositRequests = [];
    paymentChanged = true;
  }
  if (!fresh.supportTickets) {
    fresh.supportTickets = [];
    paymentChanged = true;
  }
  if (paymentChanged) {
    writeDb(fresh);
    console.log('[db] Initialized payment settings and deposit requests');
  } else {
    ensurePaymentSettings();
  }

  const forRoles = readDb();
  let rolesChanged = false;
  for (const u of forRoles.users) {
    const email = normalizeAdminEmail(u.email);
    if (SUPER_ADMIN_EMAILS.some((e) => e === email)) {
      if (u.role !== 'admin' || u.adminRole !== 'super_admin') {
        u.role = 'admin';
        u.adminRole = 'super_admin';
        delete u.adminPermissions;
        rolesChanged = true;
      }
    } else if (u.role === 'admin' && u.adminRole !== 'super_admin') {
      if (!u.adminRole) {
        u.adminRole = 'staff';
        rolesChanged = true;
      }
      if (!u.adminPermissions?.length) {
        u.adminPermissions = [...ALL_ADMIN_PERMISSIONS];
        rolesChanged = true;
      }
    }
  }
  if (rolesChanged) {
    writeDb(forRoles);
    console.log('[db] Migrated admin roles and permissions');
  }
}
