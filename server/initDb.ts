import { getStore } from './store/index.js';
import { buildSeedDatabase } from './seed.js';
import { DEFAULT_PLANS } from './defaultPlans.js';
import { DEFAULT_MILESTONES } from './defaultMilestones.js';
import { backfillKycHistory } from './services/kycHistory.js';
import { rebuildReferralTrees, migrateReferralData } from './services/referrals.js';
import { ensurePaymentSettings } from './services/paymentSettings.js';
import { DEFAULT_PAYMENT_SETTINGS } from './defaultPaymentSettings.js';
import {
  ALL_ADMIN_PERMISSIONS,
  SUPER_ADMIN_EMAILS,
  normalizeAdminEmail,
} from '../shared/adminPermissions.js';

export async function initDb(): Promise<void> {
  const store = getStore();

  if (await store.isEmpty()) {
    const seed = await buildSeedDatabase();
    await store.seed(seed);
    await rebuildReferralTrees();
    console.log('[db] Seeded users, plans, milestones, and referral network');
    return;
  }

  const plans = await store.listPlans();
  const milestones = await store.listMilestones();
  if (plans.length === 0) {
    await store.replacePlans([...DEFAULT_PLANS]);
    console.log('[db] Filled missing plans');
  }
  if (milestones.length === 0) {
    await store.replaceMilestones([...DEFAULT_MILESTONES]);
    console.log('[db] Filled missing milestones');
  }

  const users = await store.listUsers();
  let migrated = 0;
  for (const u of users) {
    const before = u.kycHistory?.length ?? 0;
    backfillKycHistory(u);
    if ((u.kycHistory?.length ?? 0) > before) {
      await store.saveUser(u);
      migrated++;
    }
  }
  if (migrated > 0) {
    console.log(`[db] Backfilled KYC history for ${migrated} user(s)`);
  }

  const paymentSettings = await store.getPaymentSettings();
  const depositRequests = await store.listDepositRequests();
  const supportTickets = await store.listSupportTickets();
  let paymentChanged = false;

  if (!paymentSettings) {
    await store.savePaymentSettings({
      ...DEFAULT_PAYMENT_SETTINGS,
      updatedAt: new Date().toISOString(),
    });
    paymentChanged = true;
  }

  if (depositRequests.length === 0 && paymentChanged) {
    // collections initialized via seed path
  }

  if (supportTickets.length === 0 && paymentChanged) {
    // no-op — empty arrays are fine
  }

  if (paymentChanged) {
    console.log('[db] Initialized payment settings');
  } else {
    await ensurePaymentSettings();
  }

  const allUsers = await store.listUsers();
  let rolesChanged = 0;
  for (const u of allUsers) {
    const email = normalizeAdminEmail(u.email);
    if (SUPER_ADMIN_EMAILS.some((e) => e === email)) {
      if (u.role !== 'admin' || u.adminRole !== 'super_admin') {
        u.role = 'admin';
        u.adminRole = 'super_admin';
        delete u.adminPermissions;
        await store.saveUser(u);
        rolesChanged++;
      }
    } else if (u.role === 'admin' && u.adminRole !== 'super_admin') {
      let changed = false;
      if (!u.adminRole) {
        u.adminRole = 'staff';
        changed = true;
      }
      if (!u.adminPermissions?.length) {
        u.adminPermissions = [...ALL_ADMIN_PERMISSIONS];
        changed = true;
      }
      if (changed) {
        await store.saveUser(u);
        rolesChanged++;
      }
    }
  }
  if (rolesChanged > 0) {
    console.log('[db] Migrated admin roles and permissions');
  }

  await migrateReferralData();
  console.log('[db] Synced referral trees from referredByUserId links');
}
