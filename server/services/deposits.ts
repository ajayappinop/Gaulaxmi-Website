import { getStore } from '../store/index.js';
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

export async function ensureDepositSettings() {
  return (await ensurePaymentSettings()).deposits;
}

async function findDepositRequest(id: string): Promise<DepositRequest | undefined> {
  const request = await getStore().findDepositRequest(id);
  return request ?? undefined;
}

async function addPendingDepositTx(
  userId: string,
  amount: number,
  depositRequestId: string,
  details: string
): Promise<string> {
  const txId = newId('tx_');
  await mutateUser(userId, (u) => {
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

export async function submitManualDepositRequest(
  userId: string,
  amount: number,
  utr: string,
  paymentNote?: string,
  paymentScreenshot?: string,
  paymentScreenshotName?: string
): Promise<User> {
  const settings = await ensureDepositSettings();
  if (settings.mode !== 'manual') {
    throw new Error('Manual deposits are disabled. Use the payment gateway.');
  }
  const dbUser = await findDbUser(userId);
  if (!dbUser) throw new Error('User not found');
  if (settings.requireKyc && !isKycVerifiedUser(dbUser)) {
    throw new Error('KYC must be approved by admin before depositing funds');
  }
  const minDeposit = settings.minAmount ?? (await getMinDepositAmount());
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
  const txId = await addPendingDepositTx(
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

  await getStore().insertDepositRequest(request);

  const updated = await findDbUser(userId);
  return toPublicUser(updated!);
}

export async function createGatewayDepositOrder(userId: string, amount: number): Promise<{
  orderId: string;
  depositRequestId: string;
  amount: number;
  mockCheckout: boolean;
}> {
  const settings = await ensureDepositSettings();
  if (settings.mode !== 'gateway') {
    throw new Error('Payment gateway is disabled. Use manual bank transfer.');
  }
  const dbUser = await findDbUser(userId);
  if (!dbUser) throw new Error('User not found');
  if (settings.requireKyc && !isKycVerifiedUser(dbUser)) {
    throw new Error('KYC must be approved by admin before depositing funds');
  }
  const minDeposit = settings.minAmount ?? (await getMinDepositAmount());
  if (!Number.isFinite(amount) || amount < minDeposit) {
    throw new Error(`Minimum deposit is ₹${minDeposit.toLocaleString('en-IN')}`);
  }

  const orderId = newId('gw_');
  const requestId = newId('dep_');
  const txId = await addPendingDepositTx(
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

  await getStore().insertDepositRequest(request);

  const gw = settings.gateway;
  const mockCheckout = gw.testMode || !gw.keyId?.trim() || !gw.keySecret?.trim();

  return { orderId, depositRequestId: requestId, amount, mockCheckout };
}

export async function completeGatewayDeposit(userId: string, orderId: string, adminEmail?: string): Promise<User> {
  const requests = await getStore().listDepositRequests();
  const request = requests.find(
    (r) => r.userId === userId && r.gatewayOrderId === orderId && r.channel === 'gateway'
  );
  if (!request) throw new Error('Payment order not found');
  if (request.status !== 'pending') throw new Error('This deposit was already processed');

  await approveDepositRequest(request.id, adminEmail || 'payment-gateway');
  const updated = await findDbUser(userId);
  return toPublicUser(updated!);
}

async function creditDepositApproval(userId: string, request: DepositRequest): Promise<void> {
  await mutateUser(userId, (u) => {
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

export async function approveDepositRequest(requestId: string, reviewedBy: string): Promise<User | null> {
  const store = getStore();
  const request = await store.findDepositRequest(requestId);
  if (!request || request.status !== 'pending') return null;

  await creditDepositApproval(request.userId, request);
  await store.updateDepositRequest(requestId, {
    status: 'approved',
    reviewedAt: new Date().toISOString(),
    reviewedBy,
  });

  const updated = await findDbUser(request.userId);
  return updated ? toPublicUser(updated) : null;
}

export async function rejectDepositRequest(
  requestId: string,
  reason: string,
  reviewedBy: string
): Promise<User | null> {
  const store = getStore();
  const request = await store.findDepositRequest(requestId);
  if (!request || request.status !== 'pending') return null;

  await mutateUser(request.userId, (u) => {
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

  await store.updateDepositRequest(requestId, {
    status: 'rejected',
    rejectionReason: reason,
    reviewedAt: new Date().toISOString(),
    reviewedBy,
  });

  const updated = await findDbUser(request.userId);
  return updated ? toPublicUser(updated) : null;
}

export async function getUserDepositRequests(userId: string): Promise<DepositRequest[]> {
  await ensureDepositSettings();
  const requests = await getStore().listDepositRequests();
  return requests
    .filter((r) => r.userId === userId)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

export async function countPendingDepositRequests(): Promise<number> {
  return getStore().countPendingDepositRequests();
}

export type DepositFilterStatus = 'all' | DepositRequestStatus;

export async function queryDepositRequests(opts: {
  status: DepositFilterStatus;
  search: string;
  page: number;
  pageSize: number;
}): Promise<PaginatedDepositRequests> {
  let rows = await getStore().listDepositRequests();
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
