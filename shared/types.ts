import type { AdminPermission, AdminStaffRole } from './adminPermissions.js';

export type UserRole = 'admin' | 'member';

export type { AdminPermission, AdminStaffRole } from './adminPermissions.js';

export type KycStatus = 'not_started' | 'submitted' | 'verified' | 'rejected';

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'investment';
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'rejected';
  details?: string;
  depositRequestId?: string;
}

export type DepositMode = 'manual' | 'gateway';

export type DepositRequestStatus = 'pending' | 'approved' | 'rejected';

export type DepositChannel = 'manual' | 'gateway';

export interface ManualDepositConfig {
  upiId: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
  instructions: string;
  /** UPI payment string used to render the QR code */
  qrPayload: string;
}

export interface GatewayDepositConfig {
  provider: 'razorpay' | 'cashfree' | 'payu' | 'other';
  enabled: boolean;
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  testMode: boolean;
}

export interface DepositSettings {
  mode: DepositMode;
  manual: ManualDepositConfig;
  gateway: GatewayDepositConfig;
  minAmount: number;
  requireKyc: boolean;
  updatedAt?: string;
}

export interface WithdrawalSettings {
  enabled: boolean;
  requireKyc: boolean;
  minAmount: number;
  maxAmountPerRequest: number;
  /** All withdrawal requests need admin approval before payout */
  adminApprovalRequired: boolean;
  /** Days notice for capital withdrawal (shown to members) */
  capitalNoticeDays: number;
  /** Members can request profit withdrawals anytime when true */
  profitWithdrawalAnytime: boolean;
  memberInstructions: string;
}

/** Platform-wide payment rules for deposits and withdrawals */
export interface PaymentSettings {
  deposits: DepositSettings;
  withdrawals: WithdrawalSettings;
  updatedAt?: string;
}

/** Member-facing deposit configuration (no secrets). */
export interface PublicDepositSettings {
  mode: DepositMode;
  manualEnabled: boolean;
  gatewayEnabled: boolean;
  manual: ManualDepositConfig;
  gateway: {
    provider: GatewayDepositConfig['provider'];
    configured: boolean;
    testMode: boolean;
  };
  minAmount: number;
  requireKyc: boolean;
}

/** Member-facing withdrawal rules */
export interface PublicWithdrawalSettings {
  enabled: boolean;
  requireKyc: boolean;
  minAmount: number;
  maxAmountPerRequest: number;
  adminApprovalRequired: boolean;
  capitalNoticeDays: number;
  profitWithdrawalAnytime: boolean;
  memberInstructions: string;
}

export interface PublicPaymentSettings {
  deposits: PublicDepositSettings;
  withdrawals: PublicWithdrawalSettings;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  channel: DepositChannel;
  status: DepositRequestStatus;
  transactionId: string;
  utr?: string;
  paymentNote?: string;
  /** Base64 data URL of payment proof screenshot (manual deposits) */
  paymentScreenshot?: string;
  paymentScreenshotName?: string;
  gatewayOrderId?: string;
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  reviewedBy?: string;
}

export interface AdminDepositRequestRow extends DepositRequest {}

export interface PaginatedDepositRequests {
  rows: AdminDepositRequestRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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
  /** 1 = direct referral, 2+ = indirect (downline) */
  level?: number;
  joinDate?: string;
  /** Name of the member who referred this person */
  referredBy?: string;
  referrerId?: string;
  email?: string;
  phone?: string;
  investmentTotal?: number;
  /** Members this referral personally invited (your indirect network) */
  downline?: Referral[];
}

export interface KycDetails {
  fullName: string;
  dob: string;
  gender: string;
  phone: string;
  docType: string;
  docNumber: string;
  docFileName: string;
  /** Base64 data URL of uploaded identity document (image or PDF). */
  docFileUrl?: string;
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
  /** User id of the member who referred this account */
  referredByUserId?: string;
  /** Display name of referrer */
  referredByName?: string;
  phone?: string;
  isDeactivated?: boolean;
  profileImage?: string;
  role?: UserRole;
  /** `super_admin` — full access + team management; `staff` — permission-scoped */
  adminRole?: AdminStaffRole;
  adminPermissions?: AdminPermission[];
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

export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type SupportTicketCategory =
  | 'general'
  | 'wallet'
  | 'kyc'
  | 'investment'
  | 'deposit'
  | 'withdrawal'
  | 'technical';

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: SupportTicketCategory;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt: string;
  adminReply?: string;
  repliedAt?: string;
  repliedBy?: string;
  resolvedAt?: string;
}

export interface PaginatedSupportTickets {
  rows: SupportTicket[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}
