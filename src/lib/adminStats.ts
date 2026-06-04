import type { User, Transaction, Investment } from './auth';
import type { ContactInquiry } from '../../shared/types';
import { isAdminUser } from './admin';

export function getMemberAccounts(users: User[]): User[] {
  return users.filter((u) => !isAdminUser(u) && u.role !== 'admin');
}

export interface AdminOverviewStats {
  totalMembers: number;
  activeMembers: number;
  deactivatedMembers: number;
  pendingKyc: number;
  verifiedKyc: number;
  pendingWithdrawals: number;
  pendingDeposits: number;
  totalWalletBalance: number;
  totalInvested: number;
  newInquiries: number;
  totalInquiries: number;
  openSupportTickets: number;
}

export function computeOverviewStats(users: User[], inquiries: ContactInquiry[] = []): AdminOverviewStats {
  const members = getMemberAccounts(users);

  let pendingWithdrawals = 0;
  let totalWalletBalance = 0;
  let totalInvested = 0;

  for (const m of members) {
    totalWalletBalance += m.balance || 0;
    totalInvested += (m.investments || []).reduce((s, i) => s + i.amount, 0);
    pendingWithdrawals += (m.transactions || []).filter(
      (t) => t.type === 'withdrawal' && t.status === 'pending'
    ).length;
  }

  return {
    totalMembers: members.length,
    activeMembers: members.filter((m) => !m.isDeactivated).length,
    deactivatedMembers: members.filter((m) => m.isDeactivated).length,
    pendingKyc: members.filter((m) => m.kycStatus === 'submitted').length,
    verifiedKyc: members.filter((m) => m.isKycVerified || m.kycStatus === 'verified').length,
    pendingWithdrawals,
    pendingDeposits: 0,
    totalWalletBalance,
    totalInvested,
    newInquiries: inquiries.filter((q) => q.status === 'new').length,
    totalInquiries: inquiries.length,
    openSupportTickets: 0,
  };
}

export interface FlatTransaction extends Transaction {
  userId: string;
  userName: string;
  userEmail: string;
}

export function flattenTransactions(users: User[]): FlatTransaction[] {
  const rows: FlatTransaction[] = [];
  for (const u of getMemberAccounts(users)) {
    for (const tx of u.transactions || []) {
      rows.push({
        ...tx,
        userId: u.id,
        userName: u.name,
        userEmail: u.email,
      });
    }
  }
  return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export interface FlatInvestment extends Investment {
  userId: string;
  userName: string;
  userEmail: string;
}

export function flattenInvestments(users: User[]): FlatInvestment[] {
  const rows: FlatInvestment[] = [];
  for (const u of getMemberAccounts(users)) {
    for (const inv of u.investments || []) {
      rows.push({
        ...inv,
        userId: u.id,
        userName: u.name,
        userEmail: u.email,
      });
    }
  }
  return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export interface PendingWithdrawalRow {
  userId: string;
  userName: string;
  userEmail: string;
  tx: Transaction;
}

export function getPendingWithdrawals(users: User[]): PendingWithdrawalRow[] {
  const rows: PendingWithdrawalRow[] = [];
  for (const u of getMemberAccounts(users)) {
    for (const tx of u.transactions || []) {
      if (tx.type === 'withdrawal' && tx.status === 'pending') {
        rows.push({ userId: u.id, userName: u.name, userEmail: u.email, tx });
      }
    }
  }
  return rows.sort((a, b) => new Date(b.tx.date).getTime() - new Date(a.tx.date).getTime());
}
