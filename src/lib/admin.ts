import type { User } from './auth';
import { api } from './apiClient';
import {
  isPanelAdminUser,
  isSuperAdminUser,
  SUPER_ADMIN_EMAILS,
} from './adminPermissions';

export type UserRole = 'admin' | 'member';

export { SUPER_ADMIN_EMAILS, isSuperAdminUser };

export function isAdminUser(user: User | null | undefined): boolean {
  return isPanelAdminUser(user);
}

export type AdminTabId =
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

export type AdminNavItem = { id: AdminTabId; label: string };

export type AdminNavSection = {
  section: string;
  items: AdminNavItem[];
};

/** Sidebar structure with a dedicated Payments group */
export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    section: 'Main',
    items: [
      { id: 'overview', label: 'Overview' },
      { id: 'users', label: 'Users' },
      { id: 'kyc', label: 'KYC Queue' },
    ],
  },
  {
    section: 'Payments',
    items: [
      { id: 'payment_settings', label: 'Payment settings' },
      { id: 'deposit_requests', label: 'Deposit requests' },
      { id: 'withdrawals', label: 'Withdrawal approvals' },
      { id: 'transactions', label: 'Transactions' },
    ],
  },
  {
    section: 'Catalog & leads',
    items: [
      { id: 'plans', label: 'Investment Plans' },
      { id: 'investments', label: 'Plan Purchases' },
      { id: 'milestones', label: 'Milestones' },
      { id: 'inquiries', label: 'Lead Inquiries' },
    ],
  },
  {
    section: 'Support',
    items: [{ id: 'support_tickets', label: 'Help & support tickets' }],
  },
];

/** Flat list for mobile nav and lookups */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV_SECTIONS.flatMap((s) => s.items);

function normalizeAppRootUrl(raw: string): string {
  const base = typeof window !== 'undefined' ? window.location.href : 'http://localhost/';
  const url = new URL(raw.trim(), base);
  if (!url.pathname.endsWith('/')) {
    url.pathname += '/';
  }
  return url.toString();
}

/** Member site base URL — set VITE_MEMBER_URL in .env (e.g. http://localhost:3000/). */
export function getMemberAppUrl(): string {
  const fromEnv = import.meta.env.VITE_MEMBER_URL?.trim();
  if (!fromEnv) {
    throw new Error('VITE_MEMBER_URL is not set. Add it to your .env file.');
  }
  return normalizeAppRootUrl(fromEnv);
}

/** Admin panel base URL — set VITE_ADMIN_URL in .env (e.g. http://localhost:3001/). */
export function getAdminAppUrl(): string {
  const fromEnv = import.meta.env.VITE_ADMIN_URL?.trim();
  if (!fromEnv) {
    throw new Error('VITE_ADMIN_URL is not set. Add it to your .env file.');
  }
  return normalizeAppRootUrl(fromEnv);
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
