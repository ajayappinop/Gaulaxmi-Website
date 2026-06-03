import type { InvestmentPlan } from '../shared/types.js';

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

export function computePlanReturns(amount: number) {
  const monthlyReturn = Math.round(amount * 0.05);
  const totalPayout = monthlyReturn * 60;
  const totalEarnings = totalPayout + amount;
  return { monthlyReturn, totalPayout, totalEarnings };
}
