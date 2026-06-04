/** Admin panel areas — matches sidebar tab ids (plus team management). */
export type AdminPermission =
  | 'overview'
  | 'users'
  | 'kyc'
  | 'payment_settings'
  | 'deposit_requests'
  | 'withdrawals'
  | 'transactions'
  | 'plans'
  | 'investments'
  | 'milestones'
  | 'inquiries'
  | 'support_tickets'
  | 'admins';

export type AdminStaffRole = 'super_admin' | 'staff';

/** Primary super admin account (can manage roles & permissions). */
export const SUPER_ADMIN_EMAILS = ['admin@gaulaxmi.io'] as const;

export const ALL_ADMIN_PERMISSIONS: AdminPermission[] = [
  'overview',
  'users',
  'kyc',
  'payment_settings',
  'deposit_requests',
  'withdrawals',
  'transactions',
  'plans',
  'investments',
  'milestones',
  'inquiries',
  'support_tickets',
];

export const ADMIN_PERMISSION_GROUPS: {
  section: string;
  permissions: { id: AdminPermission; label: string; description?: string }[];
}[] = [
  {
    section: 'Main',
    permissions: [
      { id: 'overview', label: 'Overview', description: 'Dashboard KPIs and charts' },
      { id: 'users', label: 'Users', description: 'Member list, balance, deactivate, delete' },
      { id: 'kyc', label: 'KYC queue', description: 'Review and approve KYC submissions' },
    ],
  },
  {
    section: 'Payments',
    permissions: [
      { id: 'payment_settings', label: 'Payment settings', description: 'Deposit & withdrawal rules' },
      { id: 'deposit_requests', label: 'Deposit requests', description: 'Approve manual deposits' },
      { id: 'withdrawals', label: 'Withdrawal approvals', description: 'Approve or reject withdrawals' },
      { id: 'transactions', label: 'Transactions', description: 'View deposit & withdrawal history' },
    ],
  },
  {
    section: 'Catalog & leads',
    permissions: [
      { id: 'plans', label: 'Investment plans', description: 'Edit public plan tiers' },
      { id: 'investments', label: 'Plan purchases', description: 'Assign investments to members' },
      { id: 'milestones', label: 'Milestones', description: 'Milestone fulfillment' },
      { id: 'inquiries', label: 'Lead inquiries', description: 'Website contact form leads' },
    ],
  },
  {
    section: 'Support',
    permissions: [
      {
        id: 'support_tickets',
        label: 'Help & support tickets',
        description: 'Reply to member support tickets',
      },
    ],
  },
];

export type AdminAccessUser = {
  email: string;
  role?: string;
  adminRole?: AdminStaffRole;
  adminPermissions?: AdminPermission[];
};

export function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isSuperAdminUser(user: AdminAccessUser | null | undefined): boolean {
  if (!user) return false;
  if (user.adminRole === 'super_admin') return true;
  return SUPER_ADMIN_EMAILS.includes(
    normalizeAdminEmail(user.email) as (typeof SUPER_ADMIN_EMAILS)[number]
  );
}

export function isStaffAdminUser(user: AdminAccessUser | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'admin' && user.adminRole === 'staff';
}

export function isPanelAdminUser(user: AdminAccessUser | null | undefined): boolean {
  if (!user) return false;
  if (user.role !== 'admin') return false;
  if (isSuperAdminUser(user)) return true;
  return (user.adminPermissions?.length ?? 0) > 0;
}

export function hasAdminPermission(
  user: AdminAccessUser | null | undefined,
  permission: AdminPermission
): boolean {
  if (!isPanelAdminUser(user)) return false;
  if (isSuperAdminUser(user)) return true;
  if (permission === 'overview') {
    return (user!.adminPermissions?.length ?? 0) > 0;
  }
  if (permission === 'admins') return false;
  return user!.adminPermissions?.includes(permission) ?? false;
}

export function getAdminPermissions(user: AdminAccessUser | null | undefined): AdminPermission[] {
  if (!isPanelAdminUser(user)) return [];
  if (isSuperAdminUser(user)) return [...ALL_ADMIN_PERMISSIONS, 'admins'];
  const perms = user!.adminPermissions ?? [];
  if (perms.length > 0 && !perms.includes('overview')) {
    return ['overview', ...perms];
  }
  return perms;
}

export function canAccessAdminTab(
  user: AdminAccessUser | null | undefined,
  tabId: AdminPermission
): boolean {
  return hasAdminPermission(user, tabId);
}
