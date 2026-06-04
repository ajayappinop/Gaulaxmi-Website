import type { User, Transaction, Investment } from './auth';
import type { ContactInquiry } from '../../shared/types';
import type { AdminOverviewStats } from './adminStats';
import { getMemberAccounts } from './adminStats';
import {
  getCustomDateBounds,
  getDateFilterLabel,
  hasActiveTableDateFilter,
  isDateInCustomRange,
  type TableDateFilter,
} from './tableControls';

export type OverviewDateFilter = TableDateFilter;

const CHART_COLORS = {
  brown: '#7f4e1c',
  gold: '#d4af37',
  emerald: '#059669',
  amber: '#d97706',
  rose: '#e11d48',
  sky: '#0284c7',
  stone: '#78716c',
  cream: '#c4a574',
};

export const ADMIN_CHART_PALETTE = [
  CHART_COLORS.brown,
  CHART_COLORS.gold,
  CHART_COLORS.emerald,
  CHART_COLORS.amber,
  CHART_COLORS.sky,
  CHART_COLORS.rose,
  CHART_COLORS.stone,
  CHART_COLORS.cream,
];

function timelineBounds(filter: TableDateFilter): { start: Date; end: Date; days: number } {
  const { start, end } = getCustomDateBounds(filter);
  const rangeEnd = end ?? new Date();
  let rangeStart = start;
  if (!rangeStart) {
    rangeStart = new Date(rangeEnd);
    rangeStart.setDate(rangeStart.getDate() - 29);
    rangeStart.setHours(0, 0, 0, 0);
  }
  const dayMs = 86400000;
  const days = Math.min(
    90,
    Math.max(1, Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / dayMs) + 1)
  );
  return { start: rangeStart, end: rangeEnd, days };
}

function collectTransactions(members: User[]): Transaction[] {
  const list: Transaction[] = [];
  for (const m of members) {
    for (const tx of m.transactions || []) {
      list.push(tx);
    }
  }
  return list;
}

function collectInvestments(members: User[]): Investment[] {
  const list: Investment[] = [];
  for (const m of members) {
    for (const inv of m.investments || []) {
      list.push(inv);
    }
  }
  return list;
}

export function buildKycDistribution(members: User[]) {
  const counts = {
    verified: 0,
    submitted: 0,
    rejected: 0,
    not_started: 0,
  };
  for (const m of members) {
    const s = m.kycStatus || (m.isKycVerified ? 'verified' : 'not_started');
    if (s === 'verified') counts.verified++;
    else if (s === 'submitted') counts.submitted++;
    else if (s === 'rejected') counts.rejected++;
    else counts.not_started++;
  }
  return [
    { name: 'Verified', value: counts.verified, fill: CHART_COLORS.emerald },
    { name: 'Pending review', value: counts.submitted, fill: CHART_COLORS.amber },
    { name: 'Not started', value: counts.not_started, fill: CHART_COLORS.stone },
    { name: 'Rejected', value: counts.rejected, fill: CHART_COLORS.rose },
  ].filter((d) => d.value > 0);
}

export function buildMemberStatusSplit(members: User[]) {
  const active = members.filter((m) => !m.isDeactivated).length;
  const deactivated = members.filter((m) => m.isDeactivated).length;
  return [
    { name: 'Active', value: active, fill: CHART_COLORS.emerald },
    { name: 'Deactivated', value: deactivated, fill: CHART_COLORS.rose },
  ].filter((d) => d.value > 0);
}

export function buildPendingQueuesChart(stats: AdminOverviewStats) {
  return [
    { name: 'KYC pending', value: stats.pendingKyc, fill: CHART_COLORS.amber },
    { name: 'Deposits pending', value: stats.pendingDeposits, fill: CHART_COLORS.emerald },
    { name: 'Withdrawals pending', value: stats.pendingWithdrawals, fill: CHART_COLORS.rose },
    { name: 'New inquiries', value: stats.newInquiries, fill: CHART_COLORS.sky },
  ];
}

export function buildFinancialSnapshot(stats: AdminOverviewStats) {
  return [
    { name: 'Wallet balance', amount: stats.totalWalletBalance, fill: CHART_COLORS.brown },
    { name: 'Total invested', amount: stats.totalInvested, fill: CHART_COLORS.gold },
  ];
}

export function buildTransactionVolumeByType(members: User[], filter: TableDateFilter) {
  const totals = { deposit: 0, withdrawal: 0, investment: 0 };

  for (const tx of collectTransactions(members)) {
    if (!isDateInCustomRange(tx.date, filter)) continue;
    if (tx.status === 'completed' || tx.status === 'pending') {
      totals[tx.type] += tx.amount;
    }
  }

  return [
    { name: 'Deposits', amount: totals.deposit, fill: CHART_COLORS.emerald },
    { name: 'Withdrawals', amount: totals.withdrawal, fill: CHART_COLORS.rose },
    { name: 'Investments', amount: totals.investment, fill: CHART_COLORS.brown },
  ].filter((d) => d.amount > 0);
}

export function buildTransactionActivityTimeline(members: User[], filter: TableDateFilter) {
  const { start: rangeStart, days } = timelineBounds(filter);
  const buckets: {
    date: string;
    deposits: number;
    withdrawals: number;
    investments: number;
  }[] = [];
  const keyToIndex = new Map<string, number>();

  for (let i = 0; i < days; i++) {
    const d = new Date(rangeStart);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    keyToIndex.set(key, i);
    buckets.push({
      date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      deposits: 0,
      withdrawals: 0,
      investments: 0,
    });
  }

  for (const tx of collectTransactions(members)) {
    if (!isDateInCustomRange(tx.date, filter)) continue;
    const key = new Date(tx.date).toISOString().slice(0, 10);
    const idx = keyToIndex.get(key);
    if (idx === undefined) continue;
    if (tx.type === 'deposit') buckets[idx].deposits += tx.amount;
    else if (tx.type === 'withdrawal') buckets[idx].withdrawals += tx.amount;
    else buckets[idx].investments += tx.amount;
  }

  return buckets;
}

export function buildInvestmentsByPlan(members: User[], filter: TableDateFilter) {
  const map = new Map<string, number>();

  for (const inv of collectInvestments(members)) {
    if (!isDateInCustomRange(inv.date, filter)) continue;
    const key = inv.planName || 'Unknown';
    map.set(key, (map.get(key) || 0) + inv.amount);
  }

  return Array.from(map.entries())
    .map(([name, amount], i) => ({
      name,
      amount,
      fill: ADMIN_CHART_PALETTE[i % ADMIN_CHART_PALETTE.length],
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);
}

export function buildInquiryStatusChart(inquiries: ContactInquiry[], filter: TableDateFilter) {
  const counts = { new: 0, contacted: 0, closed: 0 };

  for (const q of inquiries) {
    if (!isDateInCustomRange(q.createdAt, filter)) continue;
    counts[q.status]++;
  }

  return [
    { name: 'New', value: counts.new, fill: CHART_COLORS.sky },
    { name: 'Contacted', value: counts.contacted, fill: CHART_COLORS.amber },
    { name: 'Closed', value: counts.closed, fill: CHART_COLORS.stone },
  ].filter((d) => d.value > 0);
}

export function buildPeriodMetrics(
  members: User[],
  inquiries: ContactInquiry[],
  filter: TableDateFilter
) {
  let deposits = 0;
  let withdrawals = 0;
  let investments = 0;
  let txCount = 0;
  let investmentCount = 0;
  let inquiryCount = 0;

  for (const tx of collectTransactions(members)) {
    if (!isDateInCustomRange(tx.date, filter)) continue;
    txCount++;
    if (tx.type === 'deposit') deposits += tx.amount;
    else if (tx.type === 'withdrawal') withdrawals += tx.amount;
    else if (tx.type === 'investment') investments += tx.amount;
  }

  for (const inv of collectInvestments(members)) {
    if (!isDateInCustomRange(inv.date, filter)) continue;
    investmentCount++;
  }

  for (const q of inquiries) {
    if (!isDateInCustomRange(q.createdAt, filter)) continue;
    inquiryCount++;
  }

  return {
    deposits,
    withdrawals,
    investments,
    txCount,
    investmentCount,
    inquiryCount,
  };
}

export function computeOverviewChartData(
  users: User[],
  stats: AdminOverviewStats,
  inquiries: ContactInquiry[] = [],
  dateFilter: TableDateFilter
) {
  const members = getMemberAccounts(users);
  const rangeLabel = getDateFilterLabel(dateFilter);
  const { days: timelineDays } = timelineBounds(dateFilter);
  const rangeActive = hasActiveTableDateFilter(dateFilter);

  return {
    dateFilter,
    rangeLabel,
    periodMetrics: buildPeriodMetrics(members, inquiries, dateFilter),
    kycDistribution: buildKycDistribution(members),
    memberStatus: buildMemberStatusSplit(members),
    pendingQueues: buildPendingQueuesChart(stats),
    financialSnapshot: buildFinancialSnapshot(stats),
    transactionVolume: buildTransactionVolumeByType(members, dateFilter),
    activityTimeline: buildTransactionActivityTimeline(members, dateFilter),
    investmentsByPlan: buildInvestmentsByPlan(members, dateFilter),
    inquiryStatus: buildInquiryStatusChart(inquiries, dateFilter),
    timelineTitle: rangeActive
      ? `Transaction activity (${rangeLabel})`
      : 'Transaction activity (last 30 days)',
    timelineSubtitle: rangeActive
      ? `Daily amounts · ${timelineDays} day${timelineDays === 1 ? '' : 's'} in range`
      : 'Daily amounts · last 30 days (pick dates above to customize)',
  };
}
