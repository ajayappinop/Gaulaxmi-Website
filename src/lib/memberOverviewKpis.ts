import type { User } from './auth';
import {
  hasActiveTableDateFilter,
  isDateInCustomRange,
  type TableDateFilter,
} from './tableControls';

export interface MemberOverviewKpis {
  directIncome: number;
  indirectIncome: number;
  totalInvestment: number;
  totalWithdrawal: number;
  activePlans: number;
  planNames: string[];
}

function inRange(iso: string, filter: TableDateFilter): boolean {
  return isDateInCustomRange(iso, filter);
}

function isDirectIncomeTx(details?: string): boolean {
  if (!details) return false;
  return /referral|direct\s*bonus|refer\s*&\s*earn|invite\s*bonus/i.test(details);
}

function isIndirectIncomeTx(details?: string): boolean {
  if (!details) return false;
  return /indirect|team\s*bonus|downline|level\s*[2-9]|override|network\s*bonus/i.test(details);
}

/** Aggregate member dashboard KPIs for the selected date range. */
export function computeMemberOverviewKpis(
  user: User,
  dateFilter: TableDateFilter
): MemberOverviewKpis {
  const investments = (user.investments ?? []).filter((inv) => inRange(inv.date, dateFilter));
  const totalInvestment = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const planNames = [...new Set(investments.map((inv) => inv.planName).filter(Boolean))];

  const withdrawals = (user.transactions ?? []).filter(
    (tx) =>
      tx.type === 'withdrawal' &&
      tx.status !== 'rejected' &&
      inRange(tx.date, dateFilter)
  );
  const totalWithdrawal = withdrawals.reduce((sum, tx) => sum + tx.amount, 0);

  const completedDeposits = (user.transactions ?? []).filter(
    (tx) => tx.type === 'deposit' && tx.status === 'completed' && inRange(tx.date, dateFilter)
  );

  const directFromTx = completedDeposits
    .filter((tx) => isDirectIncomeTx(tx.details))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const indirectFromTx = completedDeposits
    .filter((tx) => isIndirectIncomeTx(tx.details))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const referralBonuses = (user.referrals ?? [])
    .filter((ref) => ref.status === 'active')
    .reduce((sum, ref) => sum + (ref.bonusEarned || 0), 0);

  const directIncome = hasActiveTableDateFilter(dateFilter)
    ? directFromTx
    : directFromTx + referralBonuses;

  const indirectIncome = indirectFromTx;

  return {
    directIncome,
    indirectIncome,
    totalInvestment,
    totalWithdrawal,
    activePlans: investments.length,
    planNames,
  };
}
