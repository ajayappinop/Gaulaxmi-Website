import type {
  AuthResponse,
  ContactInquiry,
  DepositRequest,
  DepositSettings,
  PaymentSettings,
  PublicPaymentSettings,
  InvestmentPlan,
  KycHistoryEntry,
  MilestoneTier,
  PaginatedDepositRequests,
  PaginatedKycSubmissions,
  PaginatedSupportTickets,
  PublicDepositSettings,
  SupportTicket,
  SupportTicketCategory,
  AdminPermission,
  AdminStaffRole,
  User,
} from '../../shared/types';
import type { KycDetails } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const TOKEN_KEY = 'gaulaxmi_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (options.auth !== false) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!res.ok) {
    const err = data as { error?: string };
    throw new ApiError(err?.error || res.statusText || 'Request failed', res.status);
  }

  return data as T;
}

export const api = {
  health: () => request<{ ok: boolean }>('/health', { auth: false }),

  getPlans: () => request<InvestmentPlan[]>('/plans', { auth: false }),
  getMilestones: () => request<MilestoneTier[]>('/milestones', { auth: false }),

  register: (name: string, email: string, password: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<User>('/auth/me'),

  updateProfile: (body: { name: string; email: string; phone: string; profileImage?: string }) =>
    request<User>('/auth/profile', { method: 'PATCH', body: JSON.stringify(body) }),

  changePassword: (password: string) =>
    request<{ ok: boolean }>('/auth/password', { method: 'PATCH', body: JSON.stringify({ password }) }),

  deleteAccount: () => request<{ ok: boolean }>('/auth/account', { method: 'DELETE' }),

  deactivateAccount: () => request<{ ok: boolean }>('/auth/deactivate', { method: 'POST' }),

  getPaymentSettings: () =>
    request<PublicPaymentSettings>('/payment/settings', { auth: false }),

  getDepositSettings: () =>
    request<PublicPaymentSettings>('/payment/settings', { auth: false }).then((p) => p.deposits),

  getMyDepositRequests: () => request<DepositRequest[]>('/deposits/mine'),

  submitManualDeposit: (body: {
    amount: number;
    utr: string;
    paymentNote?: string;
    paymentScreenshot: string;
    paymentScreenshotName?: string;
  }) =>
    request<User>('/deposits/manual', { method: 'POST', body: JSON.stringify(body) }),

  createGatewayDepositOrder: (amount: number) =>
    request<{ orderId: string; depositRequestId: string; amount: number; mockCheckout: boolean }>(
      '/deposits/gateway/order',
      { method: 'POST', body: JSON.stringify({ amount }) }
    ),

  completeGatewayDeposit: (orderId: string) =>
    request<User>('/deposits/gateway/complete', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    }),

  withdraw: (amount: number) =>
    request<User>('/wallet/withdraw', { method: 'POST', body: JSON.stringify({ amount }) }),

  submitKyc: (details: KycDetails) =>
    request<User>('/kyc/submit', { method: 'POST', body: JSON.stringify(details) }),

  invest: (planId: string, planName: string, amount: number) =>
    request<User>('/investments', {
      method: 'POST',
      body: JSON.stringify({ planId, planName, amount }),
    }),

  getAdminUsers: () => request<User[]>('/admin/users'),

  adminImpersonateMember: (userId: string) =>
    request<{ token: string; user: User }>(
      `/admin/users/${encodeURIComponent(userId)}/impersonate`,
      { method: 'POST' }
    ),

  getAdminInquiries: () => request<ContactInquiry[]>('/admin/inquiries'),

  updateInquiryStatus: (id: string, status: ContactInquiry['status']) =>
    request<ContactInquiry>(`/admin/inquiries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  savePlans: (plans: InvestmentPlan[]) =>
    request<InvestmentPlan[]>('/admin/plans', { method: 'PUT', body: JSON.stringify(plans) }),

  saveMilestones: (milestones: MilestoneTier[]) =>
    request<MilestoneTier[]>('/admin/milestones', {
      method: 'PUT',
      body: JSON.stringify(milestones),
    }),

  adminApproveKyc: (userId: string) =>
    request<User>(`/admin/users/${userId}/kyc/approve`, { method: 'PATCH' }),

  adminRejectKyc: (userId: string, reason: string) =>
    request<User>(`/admin/users/${userId}/kyc/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),

  getAdminKycSubmissions: (params: {
    status?: 'all' | 'submitted' | 'verified' | 'rejected';
    search?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const q = new URLSearchParams();
    if (params.status) q.set('status', params.status);
    if (params.search?.trim()) q.set('search', params.search.trim());
    if (params.page) q.set('page', String(params.page));
    if (params.pageSize) q.set('pageSize', String(params.pageSize));
    const qs = q.toString();
    return request<PaginatedKycSubmissions>(`/admin/kyc/submissions${qs ? `?${qs}` : ''}`);
  },

  adminApproveKycSubmission: (submissionId: string) =>
    request<User>(`/admin/kyc/submissions/${submissionId}/approve`, { method: 'PATCH' }),

  adminRejectKycSubmission: (submissionId: string, reason: string) =>
    request<User>(`/admin/kyc/submissions/${submissionId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),

  getKycHistory: () => request<KycHistoryEntry[]>('/kyc/history'),

  adminAdjustBalance: (userId: string, amount: number, note: string) =>
    request<User>(`/admin/users/${userId}/balance`, {
      method: 'PATCH',
      body: JSON.stringify({ amount, note }),
    }),

  adminSetDeactivated: (userId: string, deactivated: boolean) =>
    request<User>(`/admin/users/${userId}/deactivated`, {
      method: 'PATCH',
      body: JSON.stringify({ deactivated }),
    }),

  adminRemoveUser: (userId: string) =>
    request<{ ok: boolean }>(`/admin/users/${userId}`, { method: 'DELETE' }),

  adminApproveWithdrawal: (userId: string, txId: string) =>
    request<User>(`/admin/withdrawals/${userId}/${txId}/approve`, { method: 'PATCH' }),

  adminRejectWithdrawal: (userId: string, txId: string) =>
    request<User>(`/admin/withdrawals/${userId}/${txId}/reject`, { method: 'PATCH' }),

  getAdminPaymentSettings: () => request<PaymentSettings>('/admin/payment/settings'),

  updateAdminPaymentSettings: (settings: PaymentSettings) =>
    request<PaymentSettings>('/admin/payment/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  /** @deprecated Use getAdminPaymentSettings */
  getAdminDepositSettings: () =>
    request<PaymentSettings>('/admin/payment/settings').then((p) => p.deposits),

  /** @deprecated Use updateAdminPaymentSettings */
  updateAdminDepositSettings: (settings: DepositSettings) =>
    request<PaymentSettings>('/admin/payment/settings', {
      method: 'PUT',
      body: JSON.stringify({
        deposits: settings,
        withdrawals: {
          enabled: true,
          requireKyc: true,
          minAmount: 1,
          maxAmountPerRequest: 500_000,
          adminApprovalRequired: true,
          capitalNoticeDays: 15,
          profitWithdrawalAnytime: true,
          memberInstructions: '',
        },
      } as PaymentSettings),
    }).then((p) => p.deposits),

  getAdminDepositRequests: (params?: {
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    const qs = q.toString();
    return request<PaginatedDepositRequests>(
      `/admin/deposits/requests${qs ? `?${qs}` : ''}`
    );
  },

  adminApproveDeposit: (requestId: string) =>
    request<User>(`/admin/deposits/${requestId}/approve`, { method: 'PATCH' }),

  adminRejectDeposit: (requestId: string, reason: string) =>
    request<User>(`/admin/deposits/${requestId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),

  adminAssignInvestment: (userId: string, planId: string) =>
    request<User>('/admin/investments/assign', {
      method: 'POST',
      body: JSON.stringify({ userId, planId }),
    }),

  adminSetMilestoneFulfillment: (
    userId: string,
    milestoneId: string,
    status: 'eligible' | 'fulfilled' | null
  ) =>
    request<User>(`/admin/users/${userId}/milestones/${milestoneId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  importUsers: (users: User[]) =>
    request<{ count: number }>('/admin/import/users', {
      method: 'POST',
      body: JSON.stringify({ users }),
    }),

  getAdminExport: () =>
    request<{
      users: User[];
      plans: InvestmentPlan[];
      milestones: MilestoneTier[];
      inquiries: ContactInquiry[];
    }>('/admin/export'),

  getAdminAccess: () =>
    request<{
      isSuperAdmin: boolean;
      adminRole: AdminStaffRole;
      permissions: AdminPermission[];
    }>('/admin/access'),

  getAdminTeam: () =>
    request<
      {
        id: string;
        name: string;
        email: string;
        adminRole: AdminStaffRole;
        adminPermissions: AdminPermission[];
      }[]
    >('/admin/team'),

  createAdminTeamMember: (body: {
    email: string;
    name: string;
    password: string;
    permissions: AdminPermission[];
  }) =>
    request<User>('/admin/team', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateAdminTeamMember: (
    userId: string,
    body: { name?: string; permissions?: AdminPermission[]; password?: string }
  ) =>
    request<User>(`/admin/team/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  revokeAdminTeamMember: (userId: string) =>
    request<User>(`/admin/team/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    }),

  getMySupportTickets: () => request<SupportTicket[]>('/tickets/mine'),

  createSupportTicket: (body: {
    category: SupportTicketCategory;
    subject: string;
    message: string;
  }) =>
    request<SupportTicket>('/tickets', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getAdminSupportTickets: (params?: {
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    const qs = q.toString();
    return request<PaginatedSupportTickets>(
      `/admin/tickets${qs ? `?${qs}` : ''}`
    );
  },

  adminUpdateSupportTicket: (
    ticketId: string,
    body: { status?: string; adminReply?: string }
  ) =>
    request<SupportTicket>(`/admin/tickets/${encodeURIComponent(ticketId)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  getAdminStats: () =>
    request<{
      totalMembers: number;
      activeMembers: number;
      deactivatedMembers: number;
      pendingKyc: number;
      verifiedKyc: number;
      pendingWithdrawals: number;
      pendingDeposits: number;
      depositMode: 'manual' | 'gateway';
      totalWalletBalance: number;
      totalInvested: number;
      newInquiries: number;
      totalInquiries: number;
      openSupportTickets: number;
      planCount: number;
      milestoneCount: number;
    }>('/admin/stats'),

  createInquiry: (data: {
    fullname: string;
    phone: string;
    email: string;
    planId: string;
    message: string;
  }) =>
    request<ContactInquiry>('/inquiries', {
      method: 'POST',
      auth: false,
      body: JSON.stringify(data),
    }),
};
