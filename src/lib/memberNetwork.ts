import type { Referral, Transaction, User } from './auth';

export interface FlatNetworkMember {
  id: string;
  name: string;
  level: number;
  status: 'active' | 'pending';
  bonusEarned: number;
  joinDate: string;
  /** Raw ISO date for sorting */
  joinDateIso?: string;
  referredBy: string;
  email: string;
  phone: string;
  investmentTotal: number;
  /** Names of people this member referred */
  referredNames: string[];
  referredCount: number;
}

export type NetworkMemberSortField = 'name' | 'investment' | 'earnings' | 'level' | 'joined';

export interface NetworkIncomeRow {
  id: string;
  date: string;
  amount: number;
  kind: 'direct' | 'indirect';
  label: string;
  memberName?: string;
}

export interface MemberNetworkSummary {
  directCount: number;
  indirectCount: number;
  totalNetworkSize: number;
  activeCount: number;
  pendingCount: number;
  directEarnings: number;
  indirectEarnings: number;
  totalNetworkEarnings: number;
  directMembers: FlatNetworkMember[];
  indirectMembers: FlatNetworkMember[];
  allMembers: FlatNetworkMember[];
  incomeRows: NetworkIncomeRow[];
}

function isDirectIncomeTx(details?: string): boolean {
  if (!details) return false;
  return /referral|direct\s*bonus|refer\s*&\s*earn|invite\s*bonus/i.test(details);
}

function isIndirectIncomeTx(details?: string): boolean {
  if (!details) return false;
  return /indirect|team\s*bonus|downline|level\s*[2-9]|override|network\s*bonus/i.test(details);
}

function formatJoinDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function flattenReferrals(
  referrals: Referral[],
  parentName: string,
  level: number
): FlatNetworkMember[] {
  const result: FlatNetworkMember[] = [];

  for (const ref of referrals) {
    const downline = ref.downline ?? [];
    const referredNames = downline.map((d) => d.friendName);

    result.push({
      id: ref.id,
      name: ref.friendName,
      level: ref.level ?? level,
      status: ref.status,
      bonusEarned: ref.bonusEarned ?? 0,
      joinDate: formatJoinDate(ref.joinDate),
      joinDateIso: ref.joinDate,
      referredBy: ref.referredBy ?? parentName,
      email: ref.email ?? '—',
      phone: ref.phone ?? '—',
      investmentTotal: ref.investmentTotal ?? 0,
      referredNames,
      referredCount: downline.length,
    });

    if (downline.length > 0) {
      result.push(...flattenReferrals(downline, ref.friendName, level + 1));
    }
  }

  return result;
}

function incomeRowsFromTransactions(transactions: Transaction[]): NetworkIncomeRow[] {
  return transactions
    .filter(
      (tx) =>
        tx.type === 'deposit' &&
        tx.status === 'completed' &&
        (isDirectIncomeTx(tx.details) || isIndirectIncomeTx(tx.details))
    )
    .map((tx) => {
      const direct = isDirectIncomeTx(tx.details);
      const details = tx.details ?? '';
      let memberName: string | undefined;
      const dashMatch = details.match(/[—–-]\s*([A-Za-z][A-Za-z\s.]+?)(?:\s*\(|$|via)/i);
      const viaMatch = details.match(/\(([A-Za-z][A-Za-z\s.]+?)(?:\s+via|\))/i);
      memberName = dashMatch?.[1]?.trim() ?? viaMatch?.[1]?.trim();

      return {
        id: tx.id,
        date: tx.date,
        amount: tx.amount,
        kind: (direct ? 'direct' : 'indirect') as 'direct' | 'indirect',
        label: details || (direct ? 'Direct referral bonus' : 'Indirect team bonus'),
        memberName,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function findReferralNode(refs: Referral[], memberId: string): Referral | undefined {
  for (const ref of refs) {
    if (ref.id === memberId) return ref;
    if (ref.downline?.length) {
      const nested = findReferralNode(ref.downline, memberId);
      if (nested) return nested;
    }
  }
  return undefined;
}

export function sortNetworkMembers(
  members: FlatNetworkMember[],
  field: NetworkMemberSortField,
  order: 'asc' | 'desc'
): FlatNetworkMember[] {
  const dir = order === 'asc' ? 1 : -1;
  return [...members].sort((a, b) => {
    switch (field) {
      case 'investment':
        return (a.investmentTotal - b.investmentTotal) * dir;
      case 'earnings':
        return (a.bonusEarned - b.bonusEarned) * dir;
      case 'level':
        return (a.level - b.level) * dir;
      case 'joined': {
        const aTime = a.joinDateIso ? new Date(a.joinDateIso).getTime() : 0;
        const bTime = b.joinDateIso ? new Date(b.joinDateIso).getTime() : 0;
        return (aTime - bTime) * dir;
      }
      case 'name':
      default:
        return a.name.localeCompare(b.name, 'en-IN') * dir;
    }
  });
}

/** Direct + nested downline recruited by a network member. */
export function getMemberDownline(
  referrals: Referral[],
  memberId: string,
  parentName: string,
  parentLevel: number
): FlatNetworkMember[] {
  const node = findReferralNode(referrals, memberId);
  if (!node) return [];
  return flattenReferrals(node.downline ?? [], parentName, parentLevel + 1);
}

/** Income rows credited to the viewer from a specific network member. */
export function incomeRowsForMember(
  rows: NetworkIncomeRow[],
  memberName: string
): NetworkIncomeRow[] {
  const needle = memberName.trim().toLowerCase();
  if (!needle) return [];
  return rows.filter((row) => {
    if (row.memberName?.trim().toLowerCase() === needle) return true;
    return row.label.toLowerCase().includes(needle);
  });
}

export function findNetworkMember(
  summary: MemberNetworkSummary,
  memberId: string
): FlatNetworkMember | undefined {
  return summary.allMembers.find((m) => m.id === memberId);
}

/** Lightweight stats for list views (admin users table, etc.). */
export function getNetworkQuickStats(user: User): {
  directCount: number;
  indirectCount: number;
  totalNetworkSize: number;
  totalEarnings: number;
} {
  const s = computeMemberNetworkSummary(user);
  return {
    directCount: s.directCount,
    indirectCount: s.indirectCount,
    totalNetworkSize: s.totalNetworkSize,
    totalEarnings: s.totalNetworkEarnings,
  };
}

/** Aggregate full network stats, members, and income for the logged-in member. */
export function computeMemberNetworkSummary(user: User): MemberNetworkSummary {
  const referrals = user.referrals ?? [];
  const allMembers = flattenReferrals(referrals, user.name, 1);
  const directMembers = allMembers.filter((m) => m.level === 1);
  const indirectMembers = allMembers.filter((m) => m.level > 1);

  const directFromReferrals = directMembers.reduce((s, m) => s + m.bonusEarned, 0);
  const indirectFromReferrals = indirectMembers.reduce((s, m) => s + m.bonusEarned, 0);

  const incomeRows = incomeRowsFromTransactions(user.transactions ?? []);
  const directFromTx = incomeRows
    .filter((r) => r.kind === 'direct')
    .reduce((s, r) => s + r.amount, 0);
  const indirectFromTx = incomeRows
    .filter((r) => r.kind === 'indirect')
    .reduce((s, r) => s + r.amount, 0);

  const directEarnings = Math.max(directFromReferrals, directFromTx);
  const indirectEarnings = Math.max(indirectFromReferrals, indirectFromTx);
  const totalNetworkEarnings = directEarnings + indirectEarnings;

  return {
    directCount: directMembers.length,
    indirectCount: indirectMembers.length,
    totalNetworkSize: allMembers.length,
    activeCount: allMembers.filter((m) => m.status === 'active').length,
    pendingCount: allMembers.filter((m) => m.status === 'pending').length,
    directEarnings,
    indirectEarnings,
    totalNetworkEarnings,
    directMembers,
    indirectMembers,
    allMembers,
    incomeRows,
  };
}
