import type {
  AdminKycSubmissionRow,
  DbUser,
  KycDetails,
  KycHistoryEntry,
  PaginatedKycSubmissions,
  User,
} from '../../shared/types.js';
import { getStore } from '../store/index.js';
import { isAdminUser, newId, toPublicUser } from '../utils.js';

export function kycCertificateId(userId: string, phone?: string): string {
  const suffix = (phone || '').replace(/\D/g, '').slice(-4) || '0000';
  return `GLX-KYC-${(userId || '00000').slice(0, 5).toUpperCase()}-${suffix}`;
}

export type KycFilterStatus = 'all' | 'submitted' | 'verified' | 'rejected';

export function backfillKycHistory(u: DbUser): void {
  if (u.kycHistory?.length) return;
  if (!u.kycDetails) return;

  const status: KycHistoryEntry['status'] =
    u.kycStatus === 'verified' || u.isKycVerified
      ? 'verified'
      : u.kycStatus === 'rejected'
      ? 'rejected'
      : 'submitted';

  u.kycHistory = [
    {
      id: newId('kycsub_'),
      status,
      certificateId: u.kycVerificationNumber || kycCertificateId(u.id, u.phone),
      submittedAt: u.kycDetails.submittedAt || new Date().toISOString(),
      reviewedAt: status !== 'submitted' ? u.kycDetails.submittedAt : undefined,
      rejectionReason: u.kycRejectionReason,
      details: { ...u.kycDetails },
    },
  ];
}

export async function migrateAllKycHistory(): Promise<number> {
  const store = getStore();
  const users = await store.listUsers();
  let count = 0;
  for (const u of users) {
    if (isAdminUser(u)) continue;
    const before = u.kycHistory?.length ?? 0;
    backfillKycHistory(u);
    if ((u.kycHistory?.length ?? 0) > before) {
      await store.saveUser(u);
      count++;
    }
  }
  return count;
}

export function appendKycSubmission(u: DbUser, details: KycDetails, certificateId: string): KycHistoryEntry {
  if (!u.kycHistory) u.kycHistory = [];
  const entry: KycHistoryEntry = {
    id: newId('kycsub_'),
    status: 'submitted',
    certificateId,
    submittedAt: details.submittedAt || new Date().toISOString(),
    details: { ...details },
  };
  u.kycHistory.push(entry);
  return entry;
}

export async function findKycSubmission(submissionId: string): Promise<{
  user: DbUser;
  entry: KycHistoryEntry;
} | null> {
  const users = await getStore().listUsers();
  for (const user of users) {
    backfillKycHistory(user);
    const entry = user.kycHistory?.find((h) => h.id === submissionId);
    if (entry) return { user, entry };
  }
  return null;
}

function applyReviewToUser(u: DbUser, entry: KycHistoryEntry): void {
  u.kycVerificationNumber = entry.certificateId;
  u.kycDetails = { ...entry.details };
}

export async function approveKycSubmission(submissionId: string, reviewedBy: string): Promise<User | null> {
  const store = getStore();
  const users = await store.listUsers();
  for (const u of users) {
    backfillKycHistory(u);
    const entry = u.kycHistory?.find((h) => h.id === submissionId);
    if (!entry || entry.status !== 'submitted') continue;

    const now = new Date().toISOString();
    entry.status = 'verified';
    entry.reviewedAt = now;
    entry.reviewedBy = reviewedBy;
    entry.rejectionReason = undefined;

    u.kycStatus = 'verified';
    u.isKycVerified = true;
    u.kycRejectionReason = undefined;
    applyReviewToUser(u, entry);
    await store.saveUser(u);
    return toPublicUser(u);
  }
  return null;
}

export async function rejectKycSubmission(
  submissionId: string,
  reason: string,
  reviewedBy: string
): Promise<User | null> {
  const store = getStore();
  const users = await store.listUsers();
  for (const u of users) {
    backfillKycHistory(u);
    const entry = u.kycHistory?.find((h) => h.id === submissionId);
    if (!entry || entry.status !== 'submitted') continue;

    const now = new Date().toISOString();
    entry.status = 'rejected';
    entry.reviewedAt = now;
    entry.reviewedBy = reviewedBy;
    entry.rejectionReason = reason;

    u.kycStatus = 'rejected';
    u.isKycVerified = false;
    u.kycRejectionReason = reason;
    applyReviewToUser(u, entry);
    await store.saveUser(u);
    return toPublicUser(u);
  }
  return null;
}

export async function approveLatestKycForUser(userId: string, reviewedBy: string): Promise<User | null> {
  const u = await getStore().findUser(userId);
  if (!u) return null;
  backfillKycHistory(u);
  const entry = [...(u.kycHistory ?? [])].reverse().find((h) => h.status === 'submitted');
  if (!entry) return null;

  const now = new Date().toISOString();
  entry.status = 'verified';
  entry.reviewedAt = now;
  entry.reviewedBy = reviewedBy;
  entry.rejectionReason = undefined;

  u.kycStatus = 'verified';
  u.isKycVerified = true;
  u.kycRejectionReason = undefined;
  applyReviewToUser(u, entry);
  await getStore().saveUser(u);
  return toPublicUser(u);
}

export async function rejectLatestKycForUser(
  userId: string,
  reason: string,
  reviewedBy: string
): Promise<User | null> {
  const u = await getStore().findUser(userId);
  if (!u) return null;
  backfillKycHistory(u);
  const entry = [...(u.kycHistory ?? [])].reverse().find((h) => h.status === 'submitted');
  if (!entry) return null;

  const now = new Date().toISOString();
  entry.status = 'rejected';
  entry.reviewedAt = now;
  entry.reviewedBy = reviewedBy;
  entry.rejectionReason = reason;

  u.kycStatus = 'rejected';
  u.isKycVerified = false;
  u.kycRejectionReason = reason;
  applyReviewToUser(u, entry);
  await getStore().saveUser(u);
  return toPublicUser(u);
}

async function flattenSubmissions(): Promise<AdminKycSubmissionRow[]> {
  const rows: AdminKycSubmissionRow[] = [];
  const users = await getStore().listUsers();
  for (const u of users) {
    if (isAdminUser(u) || u.role === 'admin') continue;
    backfillKycHistory(u);
    for (const h of u.kycHistory ?? []) {
      rows.push({
        submissionId: h.id,
        userId: u.id,
        userName: h.details.fullName || u.name,
        userEmail: u.email,
        status: h.status,
        certificateId: h.certificateId,
        submittedAt: h.submittedAt,
        reviewedAt: h.reviewedAt,
        rejectionReason: h.rejectionReason,
        reviewedBy: h.reviewedBy,
        details: h.details,
      });
    }
  }
  return rows.sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
}

export async function queryKycSubmissions(options: {
  status?: KycFilterStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedKycSubmissions> {
  const status = options.status ?? 'all';
  const search = (options.search ?? '').trim().toLowerCase();
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(50, Math.max(5, options.pageSize ?? 10));

  let rows = await flattenSubmissions();

  if (status !== 'all') {
    rows = rows.filter((r) => r.status === status);
  }

  if (search) {
    rows = rows.filter(
      (r) =>
        r.userName.toLowerCase().includes(search) ||
        r.userEmail.toLowerCase().includes(search) ||
        r.certificateId.toLowerCase().includes(search) ||
        r.details.phone.includes(search) ||
        r.details.docNumber.toLowerCase().includes(search) ||
        r.userId.toLowerCase().includes(search)
    );
  }

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    rows: rows.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export async function countPendingKycSubmissions(): Promise<number> {
  const rows = await flattenSubmissions();
  return rows.filter((r) => r.status === 'submitted').length;
}
