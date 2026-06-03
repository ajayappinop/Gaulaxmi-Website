import type { DbUser, KycDetails, Transaction, User } from '../../shared/types.js';
import { readDb, updateDb } from '../db.js';
import { newId, toPublicUser } from '../utils.js';
import { computePlanReturns } from '../defaultPlans.js';
import type { InvestmentPlan } from '../../shared/types.js';
import { appendKycSubmission, kycCertificateId } from './kycHistory.js';

export { kycCertificateId };

export function findDbUser(userId: string): DbUser | undefined {
  return readDb().users.find((u) => u.id === userId);
}

export function findDbUserByEmail(email: string): DbUser | undefined {
  const norm = email.trim().toLowerCase();
  return readDb().users.find((u) => u.email.trim().toLowerCase() === norm);
}

export function mutateUser(userId: string, mutator: (u: DbUser) => void): User | null {
  let updated: User | null = null;
  updateDb((db) => {
    const idx = db.users.findIndex((u) => u.id === userId);
    if (idx === -1) return;
    mutator(db.users[idx]);
    updated = toPublicUser(db.users[idx]);
  });
  return updated;
}

export function getPlanFromDb(planId: string): InvestmentPlan | undefined {
  return readDb().plans.find((p) => p.id === planId);
}

export function recordInvestment(
  userId: string,
  plan: InvestmentPlan,
  details?: string
): User | null {
  return mutateUser(userId, (u) => {
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

export function applyKycSubmit(userId: string, details: KycDetails): User | null {
  const certId = kycCertificateId(userId, details.phone);
  const updated = mutateUser(userId, (u) => {
    u.name = details.fullName.trim() || u.name;
    u.phone = details.phone || u.phone;
    u.kycStatus = 'submitted';
    u.isKycVerified = false;
    u.kycRejectionReason = undefined;
    u.kycVerificationNumber = certId;
    u.kycDetails = details;
    appendKycSubmission(u, details, certId);
  });
  return updated;
}
