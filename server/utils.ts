import type { DbUser, User } from '../shared/types.js';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function newId(prefix = ''): string {
  return `${prefix}${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function toPublicUser(u: DbUser): User {
  const { passwordHash: _, ...rest } = u;
  return rest;
}

export function isAdminUser(u: Pick<User, 'email' | 'role'>): boolean {
  if (u.role === 'admin') return true;
  const adminEmails = ['admin@gaulaxmi.io', 'ajay@appinop.com'];
  return adminEmails.includes(normalizeEmail(u.email));
}

export function walletAddress(): string {
  return '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export function isKycVerifiedUser(u: Pick<User, 'isKycVerified' | 'kycStatus'>): boolean {
  return u.isKycVerified === true || u.kycStatus === 'verified';
}
