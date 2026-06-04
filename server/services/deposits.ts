import { readDb, updateDb } from '../db.js';
import { DEFAULT_DEPOSIT_SETTINGS } from '../defaultDepositSettings.js';
import { findDbUser, mutateUser } from './users.js';
import { isKycVerifiedUser, newId, toPublicUser } from '../utils.js';
import {
  ensurePaymentSettings,
  getDepositSettingsFromDb,
  getMinDepositAmount,
  saveDepositSettings,
  toPublicDepositSettings,
} from './paymentSettings.js';
import { validatePaymentScreenshot } from '../utils/depositScreenshot.js';
import type {
  DepositRequest,
  DepositRequestStatus,
  PaginatedDepositRequests,
  Transaction,
  User,
} from '../../shared/types.js';

export { getDepositSettingsFromDb, saveDepositSettings, toPublicDepositSettings };

export function ensureDepositSettings() {
  return ensurePaymentSettings().deposits;
}

function findDepositRequest(id: string): DepositRequest | undefined {
  return readDb().depositRequests?.find((r) => r.id === id);
}

function addPendingDepositTx(
  userId: string,
  amount: number,
  depositRequestId: string,
  details: string
): string {
  const txId = newId('tx_');
  mutateUser(userId, (u) => {
    const tx: Transaction = {
      id: txId,
      type: 'deposit',
      amount,
      date: new Date().toISOString(),
      status: 'pending',
      details,
      depositRequestId,
    };
    u.transactions = [tx, ...(u.transactions || [])];
  });
  return txId;
}

export function submitManualDepositRequest(
  userId: string,
  amount: number,
  utr: string,
  paymentNote?: string,
  paymentScreenshot?: string,
  paymentScreenshotName?: string
): User {
  const settings = ensureDepositSettings();
  if (settings.mode !== 'manual') {
    throw new Error('Manual deposits are disabled. Use the payment gateway.');
  }
  const dbUser = findDbUser(userId);
  if (!dbUser) throw new Error('User not found');
  if (settings.requireKyc && !isKycVerifiedUser(dbUser)) {
    throw new Error('KYC must be approved by admin before depositing funds');
  }
  const minDeposit = settings.minAmount ?? getMinDepositAmount();
  if (!Number.isFinite(amount) || amount < minDeposit) {
    throw new Error(`Minimum deposit is ₹${minDeposit.toLocaleString('en-IN')}`);
  }
  const utrTrim = String(utr || '').trim();
  if (!utrTrim || utrTrim.length < 6) {
    throw new Error('Valid UTR / transaction reference is required (min 6 characters)');
  }

  const screenshotCheck = validatePaymentScreenshot(paymentScreenshot, paymentScreenshotName);
  if (!screenshotCheck.ok) {
    throw new Error('error' in screenshotCheck ? screenshotCheck.error : 'Invalid screenshot');
  }

  const requestId = newId('dep_');
  const txId = addPendingDepositTx(
    userId,
    amount,
    requestId,
    `Manual deposit — UTR: ${utrTrim} (pending approval)`
  );

  const request: DepositRequest = {
    id: requestId,
    userId,
    userName: dbUser.name,
    userEmail: dbUser.email,
    amount,
    channel: 'manual',
    status: 'pending',
    transactionId: txId,
    utr: utrTrim,
    paymentNote: paymentNote?.trim() || undefined,
    paymentScreenshot: screenshotCheck.dataUrl,
    paymentScreenshotName: screenshotCheck.fileName,
    submittedAt: new Date().toISOString(),
  };

  updateDb((db) => {
    db.depositRequests = [request, ...(db.depositRequests || [])];
  });

  const updated = findDbUser(userId);
  return toPublicUser(updated!);
}

export function createGatewayDepositOrder(userId: string, amount: number): {
  orderId: string;
  depositRequestId: string;
  amount: number;
  mockCheckout: boolean;
} {
  const settings = ensureDepositSettings();
  if (settings.mode !== 'gateway') {
    throw new Error('Payment gateway is disabled. Use manual bank transfer.');
  }
  const dbUser = findDbUser(userId);
  if (!dbUser) throw new Error('User not found');
  if (settings.requireKyc && !isKycVerifiedUser(dbUser)) {
    throw new Error('KYC must be approved by admin before depositing funds');
  }
  const minDeposit = settings.minAmount ?? getMinDepositAmount();
  if (!Number.isFinite(amount) || amount < minDeposit) {
    throw new Error(`Minimum deposit is ₹${minDeposit.toLocaleString('en-IN')}`);
  }

  const orderId = newId('gw_');
  const requestId = newId('dep_');
  const txId = addPendingDepositTx(
    userId,
    amount,
    requestId,
    `Gateway deposit — order ${orderId} (awaiting payment)`
  );

  const request: DepositRequest = {
    id: requestId,
    userId,
    userName: dbUser.name,
    userEmail: dbUser.email,
    amount,
    channel: 'gateway',
    status: 'pending',
    transactionId: txId,
    gatewayOrderId: orderId,
    submittedAt: new Date().toISOString(),
  };

  updateDb((db) => {
    db.depositRequests = [request, ...(db.depositRequests || [])];
  });

  const gw = settings.gateway;
  const mockCheckout = gw.testMode || !gw.keyId?.trim() || !gw.keySecret?.trim();

  return { orderId, depositRequestId: requestId, amount, mockCheckout };
}

export function completeGatewayDeposit(userId: string, orderId: string, adminEmail?: string): User {
  const db = readDb();
  const request = (db.depositRequests || []).find(
    (r) => r.userId === userId && r.gatewayOrderId === orderId && r.channel === 'gateway'
  );
  if (!request) throw new Error('Payment order not found');
  if (request.status !== 'pending') throw new Error('This deposit was already processed');

  approveDepositRequest(request.id, adminEmail || 'payment-gateway');
  const updated = findDbUser(userId);
  return toPublicUser(updated!);
}

function creditDepositApproval(userId: string, request: DepositRequest, reviewedBy: string): void {
  mutateUser(userId, (u) => {
    u.balance += request.amount;
    u.transactions = (u.transactions || []).map((tx) =>
      tx.id === request.transactionId
        ? {
            ...tx,
            status: 'completed' as const,
            details:
              request.channel === 'gateway'
                ? `Gateway deposit approved (${request.gatewayOrderId})`
                : `Manual deposit approved (UTR: ${request.utr})`,
          }
        : tx
    );
  });
}

export function approveDepositRequest(requestId: string, reviewedBy: string): User | null {
  const db = readDb();
  const idx = (db.depositRequests || []).findIndex((r) => r.id === requestId);
  if (idx === -1) return null;
  const request = db.depositRequests![idx];
  if (request.status !== 'pending') return null;

  creditDepositApproval(request.userId, request, reviewedBy);

  updateDb((d) => {
    const i = (d.depositRequests || []).findIndex((r) => r.id === requestId);
    if (i === -1) return;
    d.depositRequests![i] = {
      ...d.depositRequests![i],
      status: 'approved',
      reviewedAt: new Date().toISOString(),
      reviewedBy,
    };
  });

  const updated = findDbUser(request.userId);
  return updated ? toPublicUser(updated) : null;
}

export function rejectDepositRequest(
  requestId: string,
  reason: string,
  reviewedBy: string
): User | null {
  const db = readDb();
  const request = (db.depositRequests || []).find((r) => r.id === requestId);
  if (!request || request.status !== 'pending') return null;

  mutateUser(request.userId, (u) => {
    u.transactions = (u.transactions || []).map((tx) =>
      tx.id === request.transactionId
        ? {
            ...tx,
            status: 'rejected' as const,
            details: `Deposit rejected: ${reason}`,
          }
        : tx
    );
  });

  updateDb((d) => {
    const i = (d.depositRequests || []).findIndex((r) => r.id === requestId);
    if (i === -1) return;
    d.depositRequests![i] = {
      ...d.depositRequests![i],
      status: 'rejected',
      rejectionReason: reason,
      reviewedAt: new Date().toISOString(),
      reviewedBy,
    };
  });

  const updated = findDbUser(request.userId);
  return updated ? toPublicUser(updated) : null;
}

export function getUserDepositRequests(userId: string): DepositRequest[] {
  ensureDepositSettings();
  return (readDb().depositRequests || [])
    .filter((r) => r.userId === userId)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

export function countPendingDepositRequests(): number {
  return (readDb().depositRequests || []).filter((r) => r.status === 'pending').length;
}

export type DepositFilterStatus = 'all' | DepositRequestStatus;

export function queryDepositRequests(opts: {
  status: DepositFilterStatus;
  search: string;
  page: number;
  pageSize: number;
}): PaginatedDepositRequests {
  let rows = [...(readDb().depositRequests || [])];
  const q = opts.search.trim().toLowerCase();
  if (opts.status !== 'all') {
    rows = rows.filter((r) => r.status === opts.status);
  }
  if (q) {
    rows = rows.filter(
      (r) =>
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        (r.utr || '').toLowerCase().includes(q) ||
        (r.gatewayOrderId || '').toLowerCase().includes(q)
    );
  }
  rows.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  const total = rows.length;
  const pageSize = Math.max(1, Math.min(50, opts.pageSize));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.max(1, Math.min(opts.page, totalPages));
  const start = (page - 1) * pageSize;
  return {
    rows: rows.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export { findDepositRequest };
