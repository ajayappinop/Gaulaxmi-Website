import type {
  AdminKycSubmissionRow,
  DbUser,
  KycDetails,
  KycHistoryEntry,
  PaginatedKycSubmissions,
  User,
} from '../../shared/types.js';
import { readDb, updateDb } from '../db.js';
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

export function migrateAllKycHistory(): number {
  const db = readDb();
  let count = 0;
  for (const u of db.users) {
    if (isAdminUser(u)) continue;
    const before = u.kycHistory?.length ?? 0;
    backfillKycHistory(u);
    if ((u.kycHistory?.length ?? 0) > before) count++;
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

export function findKycSubmission(submissionId: string): {
  user: DbUser;
  entry: KycHistoryEntry;
} | null {
  const db = readDb();
  for (const user of db.users) {
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

export function approveKycSubmission(submissionId: string, reviewedBy: string): User | null {
  let result: User | null = null;
  updateDb((db) => {
    for (const u of db.users) {
      backfillKycHistory(u);
      const entry = u.kycHistory?.find((h) => h.id === submissionId);
      if (!entry || entry.status !== 'submitted') return;

      const now = new Date().toISOString();
      entry.status = 'verified';
      entry.reviewedAt = now;
      entry.reviewedBy = reviewedBy;
      entry.rejectionReason = undefined;

      u.kycStatus = 'verified';
      u.isKycVerified = true;
      u.kycRejectionReason = undefined;
      applyReviewToUser(u, entry);
      result = toPublicUser(u);
    }
  });
  return result;
}

export function rejectKycSubmission(
  submissionId: string,
  reason: string,
  reviewedBy: string
): User | null {
  let result: User | null = null;
  updateDb((db) => {
    for (const u of db.users) {
      backfillKycHistory(u);
      const entry = u.kycHistory?.find((h) => h.id === submissionId);
      if (!entry || entry.status !== 'submitted') return;

      const now = new Date().toISOString();
      entry.status = 'rejected';
      entry.reviewedAt = now;
      entry.reviewedBy = reviewedBy;
      entry.rejectionReason = reason;

      u.kycStatus = 'rejected';
      u.isKycVerified = false;
      u.kycRejectionReason = reason;
      applyReviewToUser(u, entry);
      result = toPublicUser(u);
    }
  });
  return result;
}

export function approveLatestKycForUser(userId: string, reviewedBy: string): User | null {
  let result: User | null = null;
  updateDb((db) => {
    const u = db.users.find((x) => x.id === userId);
    if (!u) return;
    backfillKycHistory(u);
    const entry = [...(u.kycHistory ?? [])].reverse().find((h) => h.status === 'submitted');
    if (!entry) return;

    const now = new Date().toISOString();
    entry.status = 'verified';
    entry.reviewedAt = now;
    entry.reviewedBy = reviewedBy;
    entry.rejectionReason = undefined;

    u.kycStatus = 'verified';
    u.isKycVerified = true;
    u.kycRejectionReason = undefined;
    applyReviewToUser(u, entry);
    result = toPublicUser(u);
  });
  return result;
}

export function rejectLatestKycForUser(userId: string, reason: string, reviewedBy: string): User | null {
  let result: User | null = null;
  updateDb((db) => {
    const u = db.users.find((x) => x.id === userId);
    if (!u) return;
    backfillKycHistory(u);
    const entry = [...(u.kycHistory ?? [])].reverse().find((h) => h.status === 'submitted');
    if (!entry) return;

    const now = new Date().toISOString();
    entry.status = 'rejected';
    entry.reviewedAt = now;
    entry.reviewedBy = reviewedBy;
    entry.rejectionReason = reason;

    u.kycStatus = 'rejected';
    u.isKycVerified = false;
    u.kycRejectionReason = reason;
    applyReviewToUser(u, entry);
    result = toPublicUser(u);
  });
  return result;
}

function flattenSubmissions(): AdminKycSubmissionRow[] {
  const rows: AdminKycSubmissionRow[] = [];
  for (const u of readDb().users) {
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

export function queryKycSubmissions(options: {
  status?: KycFilterStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}): PaginatedKycSubmissions {
  const status = options.status ?? 'all';
  const search = (options.search ?? '').trim().toLowerCase();
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(50, Math.max(5, options.pageSize ?? 10));

  let rows = flattenSubmissions();

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

export function countPendingKycSubmissions(): number {
  return flattenSubmissions().filter((r) => r.status === 'submitted').length;
}
