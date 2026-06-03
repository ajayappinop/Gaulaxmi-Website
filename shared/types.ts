export type UserRole = 'admin' | 'member';

export type KycStatus = 'not_started' | 'submitted' | 'verified' | 'rejected';

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'investment';
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'rejected';
  details?: string;
}

export interface Investment {
  id: string;
  planId?: string;
  planName: string;
  amount: number;
  date: string;
}

export interface Referral {
  id: string;
  friendName: string;
  status: 'active' | 'pending';
  bonusEarned: number;
}

export interface KycDetails {
  fullName: string;
  dob: string;
  gender: string;
  phone: string;
  docType: string;
  docNumber: string;
  docFileName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  submittedAt: string;
}

/** One KYC submission record (full history per member). */
export interface KycHistoryEntry {
  id: string;
  status: 'submitted' | 'verified' | 'rejected';
  certificateId: string;
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  reviewedBy?: string;
  details: KycDetails;
}

export interface AdminKycSubmissionRow {
  submissionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'submitted' | 'verified' | 'rejected';
  certificateId: string;
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  reviewedBy?: string;
  details: KycDetails;
}

export interface PaginatedKycSubmissions {
  rows: AdminKycSubmissionRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  balance: number;
  walletAddress: string;
  isKycVerified: boolean;
  kycStatus?: KycStatus;
  kycVerificationNumber?: string;
  kycRejectionReason?: string;
  kycDetails?: KycDetails;
  kycHistory?: KycHistoryEntry[];
  investments: Investment[];
  transactions: Transaction[];
  referrals: Referral[];
  referralLink: string;
  phone?: string;
  isDeactivated?: boolean;
  profileImage?: string;
  role?: UserRole;
  milestoneFulfillment?: Record<string, 'eligible' | 'fulfilled'>;
}

export interface DbUser extends User {
  passwordHash: string;
}

export interface InvestmentPlan {
  id: string;
  tier: string;
  amount: number;
  monthlyReturn: number;
  totalPayout: number;
  totalEarnings: number;
  featured?: boolean;
}

export interface MilestoneTier {
  id: string;
  minInvest: number;
  label: string;
  cows: string;
  bonus: string;
  tenureYears?: number;
}

export type InquiryStatus = 'new' | 'contacted' | 'closed';

export interface ContactInquiry {
  id: string;
  fullname: string;
  phone: string;
  email: string;
  planId: string;
  planLabel: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
