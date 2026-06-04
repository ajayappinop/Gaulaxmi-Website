/** Dashboard tab ids — keep in sync with Dashboard sidebar */
export type DashboardTabId =
  | 'overview'
  | 'investments'
  | 'progress'
  | 'wallet'
  | 'kyc'
  | 'transactions'
  | 'referrals'
  | 'hierarchy'
  | 'profile'
  | 'settings'
  | 'support';

export interface DashboardNavItem {
  id: DashboardTabId;
  /** Profile dropdown & mobile menu */
  label: string;
  /** Compact label for dashboard sidebar */
  sidebarLabel: string;
}

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { id: 'overview', label: 'Overview', sidebarLabel: 'Overview' },
  { id: 'wallet', label: 'Wallet & Transfers', sidebarLabel: 'Wallet & Transfers' },
  { id: 'investments', label: 'My Investments', sidebarLabel: 'My Investments' },
  { id: 'progress', label: 'Investment Progress', sidebarLabel: 'Progress' },
  { id: 'transactions', label: 'Transaction History', sidebarLabel: 'Transaction History' },
  { id: 'referrals', label: 'Refer & Earn', sidebarLabel: 'Refer & Earn' },
  { id: 'hierarchy', label: 'My Network', sidebarLabel: 'My Network' },
  { id: 'kyc', label: 'KYC Verification', sidebarLabel: 'KYC' },
  { id: 'support', label: 'Help & Support', sidebarLabel: 'Help & Support' },
  { id: 'profile', label: 'My Profile', sidebarLabel: 'My Profile' },
  { id: 'settings', label: 'Account Settings', sidebarLabel: 'Settings' },
];

export function isDashboardTabId(value: string): value is DashboardTabId {
  return DASHBOARD_NAV_ITEMS.some((item) => item.id === value);
}
