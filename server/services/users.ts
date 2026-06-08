import type { DbUser, KycDetails, Transaction, User } from '../../shared/types.js';
import type { InvestmentPlan } from '../../shared/types.js';
import { getStore } from '../store/index.js';
import { newId, toPublicUser } from '../utils.js';
import { computePlanReturns } from '../defaultPlans.js';
import { appendKycSubmission, kycCertificateId } from './kycHistory.js';
import {
  processReferralBonusesOnInvestment,
  syncReferralSnapshotsForUser,
} from './referrals.js';

export { kycCertificateId };

export async function findDbUser(userId: string): Promise<DbUser | undefined> {
  const user = await getStore().findUser(userId);
  return user ?? undefined;
}

export async function findDbUserByEmail(email: string): Promise<DbUser | undefined> {
  const user = await getStore().findUserByEmail(email);
  return user ?? undefined;
}

export async function mutateUser(userId: string, mutator: (u: DbUser) => void): Promise<User | null> {
  const store = getStore();
  const user = await store.findUser(userId);
  if (!user) return null;
  mutator(user);
  await store.saveUser(user);
  return toPublicUser(user);
}

export async function getPlanFromDb(planId: string): Promise<InvestmentPlan | undefined> {
  const plan = await getStore().findPlan(planId);
  return plan ?? undefined;
}

export async function recordInvestment(
  userId: string,
  plan: InvestmentPlan,
  details?: string
): Promise<User | null> {
  const result = await mutateUser(userId, (u) => {
    const amount = plan.amount;
    if (u.balance < amount) throw new Error('Insufficient balance');
    const inv = {
      id: newId('inv_'),
      planId: plan.id,
      planName: plan.tier,
      amount,
      date: new Date().toISOString(),
    };
    const tx: Transaction = {
      id: newId('tx_'),
      type: 'investment',
      amount,
      date: new Date().toISOString(),
      status: 'completed',
      details: details ?? plan.tier,
    };
    u.balance -= amount;
    u.investments = [...(u.investments || []), inv];
    u.transactions = [tx, ...(u.transactions || [])];
  });

  if (result) {
    await processReferralBonusesOnInvestment(userId);
    await syncReferralSnapshotsForUser(userId);
  }

  return result;
}

export function buildPlanFromBody(body: {
  id?: string;
  tier: string;
  amount: number;
  featured?: boolean;
}): InvestmentPlan {
  const returns = computePlanReturns(body.amount);
  const id =
    body.id ||
    body.tier
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') ||
    newId('plan_');
  return {
    id,
    tier: body.tier.trim(),
    amount: Math.round(body.amount),
    ...returns,
    featured: body.featured ?? false,
  };
}

export async function applyKycSubmit(userId: string, details: KycDetails): Promise<User | null> {
  const certId = kycCertificateId(userId, details.phone);
  return mutateUser(userId, (u) => {
    u.name = details.fullName.trim() || u.name;
    u.phone = details.phone || u.phone;
    u.kycStatus = 'submitted';
    u.isKycVerified = false;
    u.kycRejectionReason = undefined;
    u.kycVerificationNumber = certId;
    u.kycDetails = details;
    appendKycSubmission(u, details, certId);
  });
}
