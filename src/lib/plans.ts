import { loadPlans, DEFAULT_PLANS } from './planStore';

export interface InvestmentPlan {
  id: string;
  tier: string;
  amount: number;
  monthlyReturn: number;
  totalPayout: number;
  totalEarnings: number;
  featured?: boolean;
}

/** Default seed tiers — persisted copy lives in localStorage (`gaulaxmi_plans`) */
export const INVESTMENT_PLANS: InvestmentPlan[] = DEFAULT_PLANS;

export function getInvestmentPlans(): InvestmentPlan[] {
  return loadPlans();
}

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function getPlanById(id: string): InvestmentPlan | undefined {
  return loadPlans().find((p) => p.id === id);
}

export function getPlanByTier(tier: string): InvestmentPlan | undefined {
  return loadPlans().find((p) => p.tier.toLowerCase() === tier.toLowerCase());
}

export function getPlanSelectLabel(plan: InvestmentPlan): string {
  return `${plan.tier} — ${formatINR(plan.amount)} (5% monthly)`;
}

/** Marketing card display strings */
export function planToMarketingCard(plan: InvestmentPlan) {
  return {
    tier: plan.tier,
    invest: formatINR(plan.amount),
    monthly: formatINR(plan.monthlyReturn),
    total: formatINR(plan.totalPayout),
    earnings: formatINR(plan.totalEarnings),
    featured: plan.featured,
  };
}
