import { normalizeEmail } from './validation';
import type { User } from './auth';
import { api } from './apiClient';

export type UserRole = 'admin' | 'member';

/** Emails that always receive admin access (demo + primary admin) */
export const ADMIN_EMAILS = ['admin@gaulaxmi.io', 'ajay@appinop.com'];

export function isAdminUser(
  user: { email: string; role?: UserRole } | null | undefined
): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return ADMIN_EMAILS.includes(normalizeEmail(user.email));
}

export type AdminTabId =
  | 'overview'
  | 'users'
  | 'kyc'
  | 'withdrawals'
  | 'transactions'
  | 'plans'
  | 'investments'
  | 'milestones'
  | 'inquiries';

export const ADMIN_NAV_ITEMS: { id: AdminTabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'kyc', label: 'KYC Queue' },
  { id: 'withdrawals', label: 'Withdrawals' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'plans', label: 'Investment Plans' },
  { id: 'investments', label: 'Plan Purchases' },
  { id: 'milestones', label: 'Milestones' },
  { id: 'inquiries', label: 'Lead Inquiries' },
];

export function getMemberAppUrl(): string {
  if (typeof window !== 'undefined') {
    if (import.meta.env.DEV && window.location.port === '3001') {
      return 'http://localhost:3000/';
    }
    return `${window.location.origin}/`;
  }
  return 'http://localhost:3000/';
}

export function getAdminAppUrl(): string {
  if (import.meta.env.DEV) {
    return 'http://localhost:3001/';
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/admin/`;
  }
  return '/admin/';
}

export function exportAccountsJson(users: User[]): string {
  return JSON.stringify(users, null, 2);
}

export async function importAccountsJson(
  json: string
): Promise<{ ok: true; count: number } | { ok: false; message: string }> {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) {
      return { ok: false, message: 'JSON must be an array of user accounts.' };
    }
    const { count } = await api.importUsers(parsed);
    return { ok: true, count };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Invalid JSON file.',
    };
  }
}
