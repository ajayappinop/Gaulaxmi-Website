import type { DbUser, Referral, Transaction, User } from '../../shared/types.js';
import { getStore } from '../store/index.js';
import { findDbUser } from './users.js';
import { isAdminUser, newId, normalizeEmail, toPublicUser, walletAddress } from '../utils.js';

/** Direct referrer bonus — 10% of referee's first investment. */
const DIRECT_BONUS_RATE = 0.1;
/** Indirect upline bonus per level — 3% of referee's first investment. */
const INDIRECT_BONUS_RATE = 0.03;
const MAX_UPLINE_LEVELS = 5;

export function parseReferrerId(raw?: string | null): string | null {
  if (!raw?.trim()) return null;
  const code = raw.trim();
  const fromUrl = code.replace(/^.*\/ref\//i, '').split(/[/?#]/)[0]?.trim();
  return fromUrl || code;
}

function sumInvestment(user: Pick<User, 'investments'>): number {
  return (user.investments ?? []).reduce((sum, inv) => sum + inv.amount, 0);
}

function memberJoinDate(member: DbUser): string | undefined {
  return (
    member.kycDetails?.submittedAt ??
    member.investments?.[0]?.date ??
    member.transactions?.[0]?.date
  );
}

function computeBonusFromTransactions(rootReferrer: DbUser, referee: DbUser): number {
  const name = referee.name.trim();
  if (!name) return 0;

  return (rootReferrer.transactions ?? [])
    .filter((tx) => {
      if (tx.type !== 'deposit' || tx.status !== 'completed' || !tx.details) return false;
      const details = tx.details;
      return (
        details.includes(`— ${name}`) ||
        details.includes(`(${name}`) ||
        details.includes(` ${name} via`)
      );
    })
    .reduce((sum, tx) => sum + tx.amount, 0);
}

function listMemberUsers(all: DbUser[]): DbUser[] {
  return all.filter((u) => u.role === 'member' && !isAdminUser(u));
}

/** Build one member's downline tree purely from referredByUserId links. */
function buildReferralNode(
  member: DbUser,
  allMembers: DbUser[],
  rootReferrer: DbUser,
  level: number,
  parentName: string
): Referral {
  const invTotal = sumInvestment(member);
  const isActive = invTotal > 0 || member.isKycVerified;
  const children = allMembers.filter((m) => m.referredByUserId === member.id);

  return {
    id: member.id,
    friendName: member.name,
    status: isActive ? 'active' : 'pending',
    bonusEarned: computeBonusFromTransactions(rootReferrer, member),
    level,
    joinDate: memberJoinDate(member),
    referredBy: level === 1 ? rootReferrer.name : (member.referredByName ?? parentName),
    referrerId: level === 1 ? rootReferrer.id : member.referredByUserId,
    email: member.email,
    phone: member.phone ?? '',
    investmentTotal: invTotal,
    downline: children.map((child) =>
      buildReferralNode(child, allMembers, rootReferrer, level + 1, member.name)
    ),
  };
}

/** Direct referrals + nested downline for a member, derived from DB relationships. */
export function buildReferralsFromDb(rootMember: DbUser, allMembers: DbUser[]): Referral[] {
  const directChildren = allMembers.filter((m) => m.referredByUserId === rootMember.id);
  return directChildren.map((child) =>
    buildReferralNode(child, allMembers, rootMember, 1, rootMember.name)
  );
}

/** Rebuild and persist referrals[] for one member from live referredByUserId data. */
export async function syncReferralsForUserFromDb(userId: string): Promise<DbUser | null> {
  const store = getStore();
  const all = await store.listUsers();
  const members = listMemberUsers(all);
  const user = members.find((u) => u.id === userId) ?? (await findDbUser(userId));
  if (!user || isAdminUser(user)) return null;

  user.referrals = buildReferralsFromDb(user, members);
  await store.saveUser(user);
  return user;
}

/** Re-sync referral trees for a member and their entire upline chain. */
export async function resyncReferralsForUserAndUpline(userId: string): Promise<void> {
  const seen = new Set<string>();
  let currentId: string | undefined = userId;

  while (currentId && !seen.has(currentId)) {
    seen.add(currentId);
    await syncReferralsForUserFromDb(currentId);
    const user = await findDbUser(currentId);
    currentId = user?.referredByUserId;
  }
}

/** Rebuild every member's referrals[] from referredByUserId (startup / migration). */
export async function resyncAllReferralArraysFromDb(): Promise<void> {
  const store = getStore();
  const all = await store.listUsers();
  const members = listMemberUsers(all);

  for (const member of members) {
    member.referrals = buildReferralsFromDb(member, members);
    await store.saveUser(member);
  }
}

/** @deprecated Use resyncAllReferralArraysFromDb — kept for seed script compatibility. */
export async function rebuildReferralTrees(): Promise<void> {
  await resyncAllReferralArraysFromDb();
}

const LEAKED_SEED_REFERRAL_NAMES = [
  'Rahul Kumar',
  'Anita Desai',
  'Karan Mehta',
  'Suresh Patel',
  'Meera Joshi',
  'Vikram Singh',
];

function isLeakedSeedReferralTx(tx: Transaction): boolean {
  if (tx.type !== 'deposit' || tx.status !== 'completed' || !tx.details) return false;
  if (!/referral bonus|team bonus|network bonus/i.test(tx.details)) return false;
  return LEAKED_SEED_REFERRAL_NAMES.some((name) => tx.details!.includes(name));
}

/** Copy referredByUserId from legacy referrals[] before trees are rebuilt. */
export async function backfillReferredByFromLegacyReferrals(): Promise<number> {
  const store = getStore();
  const all = await store.listUsers();
  const members = listMemberUsers(all);
  let fixed = 0;

  for (const referrer of members) {
    for (const ref of referrer.referrals ?? []) {
      if ((ref.level ?? 1) !== 1) continue;
      const child = members.find((m) => m.id === ref.id);
      if (!child || child.referredByUserId) continue;
      child.referredByUserId = referrer.id;
      child.referredByName = referrer.name;
      await store.saveUser(child);
      fixed++;
    }
  }

  return fixed;
}

/** Remove seed/demo referral bonus transactions copied onto real member accounts. */
export async function stripLeakedSeedReferralTransactions(): Promise<number> {
  const store = getStore();
  const all = await store.listUsers();
  const members = listMemberUsers(all);
  let fixed = 0;

  for (const member of members) {
    const leaked = (member.transactions ?? []).filter(isLeakedSeedReferralTx);
    if (leaked.length === 0) continue;

    const leakedTotal = leaked.reduce((sum, tx) => sum + tx.amount, 0);
    member.transactions = (member.transactions ?? []).filter((tx) => !isLeakedSeedReferralTx(tx));
    member.balance = Math.max(0, member.balance - leakedTotal);
    await store.saveUser(member);
    fixed++;
  }

  return fixed;
}

/** Link an existing referee to their referrer when registration missed referrerId. */
export async function linkReferrerByEmail(
  refereeEmail: string,
  referrerEmail: string
): Promise<boolean> {
  const store = getStore();
  const all = await store.listUsers();
  const referee = all.find((u) => normalizeEmail(u.email) === normalizeEmail(refereeEmail));
  const referrer = all.find((u) => normalizeEmail(u.email) === normalizeEmail(referrerEmail));
  if (!referee || !referrer || isAdminUser(referee) || isAdminUser(referrer)) return false;
  if (referee.referredByUserId) return false;

  referee.referredByUserId = referrer.id;
  referee.referredByName = referrer.name;
  await store.saveUser(referee);
  await resyncReferralsForUserAndUpline(referrer.id);
  return true;
}

/** Full referral data migration — run on every startup before serving traffic. */
export async function migrateReferralData(): Promise<void> {
  const legacyLinks = await backfillReferredByFromLegacyReferrals();
  if (legacyLinks > 0) {
    console.log(`[db] Backfilled referredByUserId for ${legacyLinks} member(s) from legacy referrals`);
  }

  const stripped = await stripLeakedSeedReferralTransactions();
  if (stripped > 0) {
    console.log(`[db] Removed leaked seed referral transactions from ${stripped} member(s)`);
  }

  await resyncAllReferralArraysFromDb();
}

function creditReferrerBonus(
  referrer: DbUser,
  referee: DbUser,
  amount: number,
  level: number
): void {
  if (amount <= 0) return;

  const isDirect = level === 1;
  const tx: Transaction = {
    id: newId('tx_'),
    type: 'deposit',
    amount,
    date: new Date().toISOString(),
    status: 'completed',
    details: isDirect
      ? `Direct referral bonus — ${referee.name}`
      : `Indirect team bonus — Level ${level} (${referee.name} via ${referee.referredByName ?? 'network'})`,
  };

  referrer.balance += amount;
  referrer.transactions = [tx, ...(referrer.transactions ?? [])];
}

export async function attachReferralOnRegister(
  newUser: DbUser,
  referrerIdRaw?: string | null
): Promise<string | null> {
  const referrerId = parseReferrerId(referrerIdRaw);
  if (!referrerId || referrerId === newUser.id) return null;

  const directReferrer = await findDbUser(referrerId);
  if (!directReferrer || isAdminUser(directReferrer)) return null;

  newUser.referredByUserId = directReferrer.id;
  newUser.referredByName = directReferrer.name;
  return directReferrer.id;
}

/** When a member makes their first investment, activate referral and credit upline bonuses. */
export async function processReferralBonusesOnInvestment(investorUserId: string): Promise<void> {
  const investor = await findDbUser(investorUserId);
  if (!investor?.referredByUserId) return;

  const investments = investor.investments ?? [];
  if (investments.length !== 1) return;

  const investmentAmount = investments[0]?.amount ?? 0;
  if (investmentAmount <= 0) return;

  let level = 1;
  let referrerId: string | undefined = investor.referredByUserId;
  const creditedReferrerIds: string[] = [];

  while (referrerId && level <= MAX_UPLINE_LEVELS) {
    const referrer = await findDbUser(referrerId);
    if (!referrer) break;

    const existingBonus = computeBonusFromTransactions(referrer, investor);
    if (existingBonus > 0) {
      referrerId = referrer.referredByUserId;
      level++;
      continue;
    }

    const rate = level === 1 ? DIRECT_BONUS_RATE : INDIRECT_BONUS_RATE;
    const bonus = Math.round(investmentAmount * rate);
    if (bonus > 0) {
      creditReferrerBonus(referrer, investor, bonus, level);
      await getStore().saveUser(referrer);
      creditedReferrerIds.push(referrer.id);
    }

    referrerId = referrer.referredByUserId;
    level++;
  }

  for (const id of creditedReferrerIds) {
    await syncReferralsForUserFromDb(id);
  }
}

/** Keep referral rows in sync when referee profile or investments change. */
export async function syncReferralSnapshotsForUser(userId: string): Promise<void> {
  const user = await findDbUser(userId);
  if (!user) return;

  await syncReferralsForUserFromDb(userId);

  let ancestorId: string | undefined = user.referredByUserId;
  const seen = new Set<string>();
  while (ancestorId && !seen.has(ancestorId)) {
    seen.add(ancestorId);
    await syncReferralsForUserFromDb(ancestorId);
    const ancestor = await findDbUser(ancestorId);
    ancestorId = ancestor?.referredByUserId;
  }
}

export async function registerMemberWithReferral(body: {
  name: string;
  email: string;
  passwordHash: string;
  referrerId?: string | null;
}): Promise<User> {
  const id = newId('usr_');
  const newUser: DbUser = {
    id,
    role: 'member',
    name: body.name.trim(),
    email: body.email,
    passwordHash: body.passwordHash,
    balance: 0,
    walletAddress: walletAddress(),
    isKycVerified: false,
    kycStatus: 'not_started',
    investments: [],
    transactions: [],
    referrals: [],
    referralLink: `https://gaulaxmi.com/ref/${id}`,
    phone: '',
  };

  const directReferrerId = await attachReferralOnRegister(newUser, body.referrerId);
  await getStore().insertUser(newUser);

  if (directReferrerId) {
    await resyncReferralsForUserAndUpline(directReferrerId);
  }

  const synced = (await syncReferralsForUserFromDb(id)) ?? newUser;
  return toPublicUser(synced);
}
