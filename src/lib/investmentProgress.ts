import type { Investment } from './auth';
import { computePlanReturns, PLAN_MONTHLY_RATE, PLAN_TENURE_MONTHS } from './planStore';

const MS_PER_MONTH = (365.25 / 12) * 24 * 60 * 60 * 1000;

export interface InvestmentProgressRow {
  investment: Investment;
  monthsElapsed: number;
  monthsRemaining: number;
  tenureMonths: number;
  monthlyReturn: number;
  earnedToDate: number;
  projectedProfit: number;
  projectedTotalEarnings: number;
  progressPercent: number;
  status: 'active' | 'completed';
}

export function getMonthsSinceInvestment(startIso: string, asOf = Date.now()): number {
  const start = new Date(startIso).getTime();
  if (Number.isNaN(start)) return 0;
  return Math.max(0, Math.floor((asOf - start) / MS_PER_MONTH));
}

export function buildInvestmentProgress(
  investment: Investment,
  asOf = Date.now()
): InvestmentProgressRow {
  const monthsElapsed = Math.min(
    getMonthsSinceInvestment(investment.date, asOf),
    PLAN_TENURE_MONTHS
  );
  const { monthlyReturn, totalPayout, totalEarnings } = computePlanReturns(investment.amount);
  const earnedToDate = monthlyReturn * monthsElapsed;
  const monthsRemaining = Math.max(0, PLAN_TENURE_MONTHS - monthsElapsed);
  const progressPercent = Math.min(
    100,
    Math.round((monthsElapsed / PLAN_TENURE_MONTHS) * 100)
  );

  return {
    investment,
    monthsElapsed,
    monthsRemaining,
    tenureMonths: PLAN_TENURE_MONTHS,
    monthlyReturn,
    earnedToDate,
    projectedProfit: totalPayout,
    projectedTotalEarnings: totalEarnings,
    progressPercent,
    status: monthsElapsed >= PLAN_TENURE_MONTHS ? 'completed' : 'active',
  };
}

export function buildPortfolioProgress(investments: Investment[], asOf = Date.now()) {
  const rows = (investments || []).map((inv) => buildInvestmentProgress(inv, asOf));
  const totalInvested = rows.reduce((s, r) => s + r.investment.amount, 0);
  const earnedToDate = rows.reduce((s, r) => s + r.earnedToDate, 0);
  const projectedProfit = rows.reduce((s, r) => s + r.projectedProfit, 0);
  const projectedTotalEarnings = rows.reduce((s, r) => s + r.projectedTotalEarnings, 0);
  const overallProgressPercent =
    rows.length === 0
      ? 0
      : Math.round(rows.reduce((s, r) => s + r.progressPercent, 0) / rows.length);

  return {
    rows: rows.sort(
      (a, b) => new Date(b.investment.date).getTime() - new Date(a.investment.date).getTime()
    ),
    totalInvested,
    earnedToDate,
    projectedProfit,
    projectedTotalEarnings,
    overallProgressPercent,
    monthlyRateLabel: `${(PLAN_MONTHLY_RATE * 100).toFixed(0)}%`,
    tenureMonths: PLAN_TENURE_MONTHS,
    activePlans: rows.filter((r) => r.status === 'active').length,
    completedPlans: rows.filter((r) => r.status === 'completed').length,
  };
}
