import type { InvestmentPlan } from './plans';
import { api } from './apiClient';

export const PLANS_STORAGE_KEY = 'gaulaxmi_plans';
export const PLANS_UPDATED_EVENT = 'gaulaxmi-plans-updated';

export const PLAN_TENURE_MONTHS = 60;
export const PLAN_MONTHLY_RATE = 0.05;
const MONTHS = PLAN_TENURE_MONTHS;
const MONTHLY_RATE = PLAN_MONTHLY_RATE;

export const DEFAULT_PLANS: InvestmentPlan[] = [
  { id: 'starter', tier: 'Starter', amount: 100_000, monthlyReturn: 5_000, totalPayout: 300_000, totalEarnings: 400_000 },
  { id: 'basic', tier: 'Basic', amount: 200_000, monthlyReturn: 10_000, totalPayout: 600_000, totalEarnings: 800_000 },
  { id: 'bronze', tier: 'Bronze', amount: 300_000, monthlyReturn: 15_000, totalPayout: 900_000, totalEarnings: 1_200_000 },
  { id: 'copper', tier: 'Copper', amount: 400_000, monthlyReturn: 20_000, totalPayout: 1_200_000, totalEarnings: 1_600_000 },
  { id: 'silver', tier: 'Silver', amount: 500_000, monthlyReturn: 25_000, totalPayout: 1_500_000, totalEarnings: 2_000_000, featured: true },
  { id: 'gold', tier: 'Gold', amount: 1_000_000, monthlyReturn: 50_000, totalPayout: 3_000_000, totalEarnings: 4_000_000 },
  { id: 'platinum', tier: 'Platinum', amount: 1_500_000, monthlyReturn: 75_000, totalPayout: 4_500_000, totalEarnings: 6_000_000 },
  { id: 'diamond', tier: 'Diamond', amount: 2_000_000, monthlyReturn: 100_000, totalPayout: 6_000_000, totalEarnings: 8_000_000 },
];

let cachedPlans: InvestmentPlan[] | null = null;

export function computePlanReturns(amount: number) {
  const monthlyReturn = Math.round(amount * MONTHLY_RATE);
  const totalPayout = monthlyReturn * MONTHS;
  const totalEarnings = totalPayout + amount;
  return { monthlyReturn, totalPayout, totalEarnings };
}

export function buildPlanFromInput(
  tier: string,
  amount: number,
  options?: { id?: string; featured?: boolean }
): InvestmentPlan {
  const returns = computePlanReturns(amount);
  const slug =
    options?.id ||
    tier
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') ||
    `plan-${Date.now()}`;
  return {
    id: slug,
    tier: tier.trim(),
    amount: Math.round(amount),
    ...returns,
    featured: options?.featured ?? false,
  };
}

export async function fetchPlansFromApi(): Promise<InvestmentPlan[]> {
  try {
    const plans = await api.getPlans();
    cachedPlans = plans;
    return plans;
  } catch {
    return cachedPlans ?? [...DEFAULT_PLANS];
  }
}

export function loadPlans(): InvestmentPlan[] {
  if (cachedPlans?.length) return [...cachedPlans];
  return [...DEFAULT_PLANS];
}

export function setPlansCache(plans: InvestmentPlan[]): void {
  cachedPlans = plans;
  window.dispatchEvent(new CustomEvent(PLANS_UPDATED_EVENT));
}

export function notifyPlansUpdated(): void {
  window.dispatchEvent(new CustomEvent(PLANS_UPDATED_EVENT));
}

export async function savePlans(plans: InvestmentPlan[]): Promise<InvestmentPlan[]> {
  const saved = await api.savePlans(plans);
  setPlansCache(saved);
  return saved;
}

export async function upsertPlan(plan: InvestmentPlan): Promise<void> {
  const list = loadPlans();
  const idx = list.findIndex((p) => p.id === plan.id);
  if (idx >= 0) list[idx] = plan;
  else list.push(plan);
  await savePlans(list.sort((a, b) => a.amount - b.amount));
}

export async function deletePlanById(id: string): Promise<boolean> {
  const list = loadPlans().filter((p) => p.id !== id);
  if (list.length === loadPlans().length) return false;
  await savePlans(list.length ? list : DEFAULT_PLANS);
  return true;
}

export function getPlanByIdFromStore(id: string): InvestmentPlan | undefined {
  return loadPlans().find((p) => p.id === id);
}

export function getPlanByTierFromStore(tier: string): InvestmentPlan | undefined {
  return loadPlans().find((p) => p.tier.toLowerCase() === tier.toLowerCase());
}

export function countPurchasesByPlan(
  planId: string,
  planName: string,
  investments: { planId?: string; planName: string }[]
): number {
  return investments.filter(
    (inv) =>
      inv.planId === planId ||
      inv.planName.toLowerCase() === planName.toLowerCase()
  ).length;
}
