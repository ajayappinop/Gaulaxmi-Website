import type { Referral, User } from './auth';

export interface NetworkNode {
  id: string;
  name: string;
  phone: string;
  email: string;
  level: number;
  role: string;
  joinDate: string;
  totalReferrals: number;
  status: 'active' | 'pending';
  totalInvested: string;
  monthlyPayout: string;
  bonusEarned: number;
  referredNames: string[];
  isCurrentUser?: boolean;
  referredBy?: string;
  children: NetworkNode[];
}

function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatJoinDate(user: User): string {
  const candidate =
    user.kycDetails?.submittedAt ??
    user.investments[0]?.date ??
    user.transactions[0]?.date;

  if (!candidate) return '—';

  return new Date(candidate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatRefJoinDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function referralToNode(
  ref: Referral,
  parentName: string,
  level: number
): NetworkNode {
  const downline = ref.downline ?? [];
  const investment = ref.investmentTotal ?? 0;

  return {
    id: ref.id,
    name: ref.friendName,
    phone: ref.phone ?? '—',
    email: ref.email ?? '—',
    level,
    role:
      level === 1
        ? ref.status === 'active'
          ? 'Direct Referral'
          : 'Pending Direct Referral'
        : ref.status === 'active'
          ? `Indirect · Level ${level}`
          : `Pending · Level ${level}`,
    joinDate: formatRefJoinDate(ref.joinDate),
    totalReferrals: downline.length,
    status: ref.status,
    totalInvested: investment > 0 ? formatINR(investment) : ref.status === 'active' ? '—' : '₹0',
    monthlyPayout:
      ref.bonusEarned > 0
        ? `${formatINR(ref.bonusEarned)} earned by you`
        : '₹0 earned',
    bonusEarned: ref.bonusEarned ?? 0,
    referredNames: downline.map((d) => d.friendName),
    referredBy: ref.referredBy ?? parentName,
    children: downline.map((child) => referralToNode(child, ref.friendName, level + 1)),
  };
}

/** Build the member's network tree with the logged-in user at the center. */
export function buildNetworkTreeFromUser(user: User): NetworkNode {
  const totalInvested = user.investments.reduce((sum, inv) => sum + inv.amount, 0);
  const referrals = user.referrals ?? [];
  const estimatedYield = totalInvested > 0 ? Math.round(totalInvested * 0.05) : 0;

  function countDownline(refs: typeof referrals): number {
    return refs.reduce((sum, r) => sum + 1 + countDownline(r.downline ?? []), 0);
  }

  return {
    id: user.id,
    name: user.name,
    phone: user.phone || user.kycDetails?.phone || '—',
    email: user.email,
    level: 1,
    role: user.isKycVerified ? 'Verified Cow Investor' : 'Member',
    joinDate: formatJoinDate(user),
    totalReferrals: referrals.length,
    status: user.isDeactivated ? 'pending' : 'active',
    totalInvested: totalInvested > 0 ? formatINR(totalInvested) : '₹0',
    monthlyPayout: estimatedYield > 0 ? `${formatINR(estimatedYield)} / mo est.` : '₹0 / mo',
    bonusEarned: referrals.reduce((s, r) => s + (r.bonusEarned ?? 0), 0),
    referredNames: referrals.map((r) => r.friendName),
    isCurrentUser: true,
    referredBy: user.referredByName,
    children: referrals.map((ref) => referralToNode(ref, user.name, 2)),
  };
}

/** Count all nodes in tree including root. */
export function countNetworkNodes(node: NetworkNode): number {
  return 1 + node.children.reduce((sum, c) => sum + countNetworkNodes(c), 0);
}
