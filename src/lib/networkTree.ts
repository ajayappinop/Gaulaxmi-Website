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

function referralToNode(ref: Referral, parentName: string, level: number): NetworkNode {
  return {
    id: ref.id,
    name: ref.friendName,
    phone: '—',
    email: '—',
    level,
    role: ref.status === 'active' ? 'Referred Member' : 'Pending Referral',
    joinDate: '—',
    totalReferrals: 0,
    status: ref.status,
    totalInvested: ref.status === 'active' ? '—' : '₹0',
    monthlyPayout:
      ref.bonusEarned > 0 ? `${formatINR(ref.bonusEarned)} referral bonus` : '₹0 / mo',
    referredBy: parentName,
    children: [],
  };
}

/** Build the member's network tree with the logged-in user at the center. */
export function buildNetworkTreeFromUser(user: User): NetworkNode {
  const totalInvested = user.investments.reduce((sum, inv) => sum + inv.amount, 0);
  const referrals = user.referrals ?? [];
  const estimatedYield = totalInvested > 0 ? Math.round(totalInvested * 0.05) : 0;

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
    isCurrentUser: true,
    children: referrals.map((ref) => referralToNode(ref, user.name, 2)),
  };
}
