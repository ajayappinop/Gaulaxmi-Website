import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './initDb.js';
import { initStore, getStore, closeStore } from './store/index.js';
import { asyncHandler } from './asyncHandler.js';
import { requireAuth, requireAdmin, signToken } from './middleware/auth.js';
import {
  requireAdminPermission,
  requireSuperAdmin,
} from './middleware/adminPermissions.js';
import { getAdminAccessPayload } from './services/adminAccess.js';
import {
  createStaffAdmin,
  listAdminTeam,
  revokeStaffAdmin,
  updateStaffAdmin,
} from './services/adminTeam.js';
import {
  findDbUser,
  findDbUserByEmail,
  mutateUser,
  getPlanFromDb,
  recordInvestment,
  applyKycSubmit,
} from './services/users.js';
import type { KycFilterStatus } from './services/kycHistory.js';
import {
  approveKycSubmission,
  rejectKycSubmission,
  approveLatestKycForUser,
  rejectLatestKycForUser,
  queryKycSubmissions,
  countPendingKycSubmissions,
  backfillKycHistory,
} from './services/kycHistory.js';
import {
  normalizeEmail,
  newId,
  toPublicUser,
  walletAddress,
  isAdminUser,
  isKycVerifiedUser,
} from './utils.js';
import type {
  ContactInquiry,
  DbUser,
  InvestmentPlan,
  KycDetails,
  MilestoneTier,
  Transaction,
} from '../shared/types.js';
import { DEFAULT_PLANS } from './defaultPlans.js';
import {
  approveDepositRequest,
  completeGatewayDeposit,
  createGatewayDepositOrder,
  getUserDepositRequests,
  queryDepositRequests,
  rejectDepositRequest,
  submitManualDepositRequest,
  countPendingDepositRequests,
} from './services/deposits.js';
import {
  countOpenSupportTickets,
  createSupportTicket,
  getUserSupportTickets,
  querySupportTickets,
  updateSupportTicket,
} from './services/tickets.js';
import {
  ensurePaymentSettings,
  getDepositSettingsFromDb,
  getPaymentSettingsFromDb,
  savePaymentSettings,
  toPublicPaymentSettings,
  validateWithdrawalAmount,
} from './services/paymentSettings.js';
import type { DepositSettings, PaymentSettings } from '../shared/types.js';

const PORT = Number(process.env.PORT) || 4000;
const app = express();
const serverDir = path.dirname(fileURLToPath(import.meta.url));
const staticRoot = path.join(serverDir, '../dist');
const serveStatic = process.env.SERVE_STATIC === '1' || process.env.NODE_ENV === 'production';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'gaulaxmi-api' });
});

// —— Public ——
app.get(
  '/api/plans',
  asyncHandler(async (_req, res) => {
    const plans = await getStore().listPlans();
    res.json(plans.length ? plans : DEFAULT_PLANS);
  })
);

app.get(
  '/api/milestones',
  asyncHandler(async (_req, res) => {
    res.json(await getStore().listMilestones());
  })
);

app.post(
  '/api/inquiries',
  asyncHandler(async (req, res) => {
    const { fullname, phone, email, planId, message } = req.body ?? {};
    if (!fullname?.trim() || !phone?.trim() || !planId) {
      return res.status(400).json({ error: 'Name, phone, and plan are required' });
    }
    const store = getStore();
    const plan = await store.findPlan(String(planId));
    const inquiry: ContactInquiry = {
      id: newId('inq_'),
      fullname: String(fullname).trim(),
      phone: String(phone).trim(),
      email: String(email || '').trim(),
      planId,
      planLabel: plan
        ? `${plan.tier} — ₹${plan.amount.toLocaleString('en-IN')}`
        : String(planId),
      message: String(message || '').trim(),
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    await store.insertInquiry(inquiry);
    res.status(201).json(inquiry);
  })
);

// —— Auth ——
app.post(
  '/api/auth/register',
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body ?? {};
    if (!name?.trim() || !email?.trim() || !password || String(password).length < 6) {
      return res.status(400).json({ error: 'Valid name, email, and password (6+ chars) required' });
    }
    const normalized = normalizeEmail(email);
    if (await findDbUserByEmail(normalized)) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    const passwordHash = await bcrypt.hash(String(password), 10);
    const id = newId('usr_');
    const newUser: DbUser = {
      id,
      role: 'member',
      name: String(name).trim(),
      email: normalized,
      passwordHash,
      balance: 0,
      walletAddress: walletAddress(),
      isKycVerified: false,
      kycStatus: 'not_started',
      investments: [],
      transactions: [],
      referrals: [
        { id: '1', friendName: 'Rahul Kumar', status: 'active', bonusEarned: 5000 },
        { id: '2', friendName: 'Priya Singh', status: 'pending', bonusEarned: 0 },
      ],
      referralLink: `https://gaulaxmi.com/ref/${id}`,
      phone: '',
    };
    await getStore().insertUser(newUser);
    const token = signToken(newUser);
    res.status(201).json({ token, user: toPublicUser(newUser) });
  })
);

app.post(
  '/api/auth/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email?.trim() || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const user = await findDbUserByEmail(normalizeEmail(email));
    if (!user) return res.status(401).json({ error: 'No account found for this email' });
    if (user.isDeactivated) return res.status(403).json({ error: 'Account deactivated' });
    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Incorrect password' });
    const token = signToken(user);
    res.json({ token, user: toPublicUser(user) });
  })
);

app.get('/api/auth/me', asyncHandler(requireAuth), (req, res) => {
  res.json(req.publicUser);
});

app.patch(
  '/api/auth/profile',
  asyncHandler(requireAuth),
  asyncHandler(async (req, res) => {
    const { name, email, phone, profileImage } = req.body ?? {};
    const updated = await mutateUser(req.auth!.userId, (u) => {
      if (name) u.name = String(name).trim();
      if (email) u.email = normalizeEmail(email);
      if (phone !== undefined) u.phone = String(phone);
      if (profileImage !== undefined) u.profileImage = profileImage;
    });
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  })
);

app.patch(
  '/api/auth/password',
  asyncHandler(requireAuth),
  asyncHandler(async (req, res) => {
    const { password } = req.body ?? {};
    if (!password || String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const hash = await bcrypt.hash(String(password), 10);
    const updated = await mutateUser(req.auth!.userId, (u) => {
      u.passwordHash = hash;
    });
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true });
  })
);

app.delete(
  '/api/auth/account',
  asyncHandler(requireAuth),
  asyncHandler(async (req, res) => {
    await getStore().deleteUser(req.auth!.userId);
    res.json({ ok: true });
  })
);

app.post(
  '/api/auth/deactivate',
  asyncHandler(requireAuth),
  asyncHandler(async (req, res) => {
    await mutateUser(req.auth!.userId, (u) => {
      u.isDeactivated = true;
    });
    res.json({ ok: true });
  })
);

// —— Payment settings & deposit requests ——
app.get(
  '/api/payment/settings',
  asyncHandler(async (_req, res) => {
    res.json(toPublicPaymentSettings(await ensurePaymentSettings()));
  })
);

app.get(
  '/api/deposits/settings',
  asyncHandler(async (_req, res) => {
    res.json(toPublicPaymentSettings(await ensurePaymentSettings()).deposits);
  })
);

app.get(
  '/api/deposits/mine',
  asyncHandler(requireAuth),
  asyncHandler(async (req, res) => {
    res.json(await getUserDepositRequests(req.auth!.userId));
  })
);

app.post(
  '/api/deposits/manual',
  asyncHandler(requireAuth),
  asyncHandler(async (req, res) => {
    try {
      const amount = Number(req.body?.amount);
      const utr = String(req.body?.utr ?? '');
      const paymentNote = req.body?.paymentNote ? String(req.body.paymentNote) : undefined;
      const paymentScreenshot = req.body?.paymentScreenshot;
      const paymentScreenshotName = req.body?.paymentScreenshotName
        ? String(req.body.paymentScreenshotName)
        : undefined;
      const updated = await submitManualDepositRequest(
        req.auth!.userId,
        amount,
        utr,
        paymentNote,
        paymentScreenshot,
        paymentScreenshotName
      );
      res.status(201).json(updated);
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Deposit request failed' });
    }
  })
);

app.post(
  '/api/deposits/gateway/order',
  asyncHandler(requireAuth),
  asyncHandler(async (req, res) => {
    try {
      const amount = Number(req.body?.amount);
      const order = await createGatewayDepositOrder(req.auth!.userId, amount);
      res.status(201).json(order);
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not create payment order' });
    }
  })
);

app.post(
  '/api/deposits/gateway/complete',
  asyncHandler(requireAuth),
  asyncHandler(async (req, res) => {
    try {
      const orderId = String(req.body?.orderId ?? '').trim();
      if (!orderId) return res.status(400).json({ error: 'orderId is required' });
      const updated = await completeGatewayDeposit(req.auth!.userId, orderId);
      res.json(updated);
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Payment confirmation failed' });
    }
  })
);

app.post('/api/wallet/deposit', asyncHandler(requireAuth), (_req, res) => {
  res.status(400).json({
    error: 'Instant deposits are disabled. Submit a deposit request from your wallet (manual transfer or payment gateway).',
  });
});

app.post(
  '/api/wallet/withdraw',
  asyncHandler(requireAuth),
  asyncHandler(async (req, res) => {
    const amount = Number(req.body?.amount);
    const dbUser = await findDbUser(req.auth!.userId);
    if (!dbUser) return res.status(404).json({ error: 'User not found' });
    const pay = await ensurePaymentSettings();
    if (!pay.withdrawals.enabled) {
      return res.status(403).json({ error: 'Withdrawals are temporarily disabled' });
    }
    if (pay.withdrawals.requireKyc && !isKycVerifiedUser(dbUser)) {
      return res.status(403).json({ error: 'KYC must be approved by admin before withdrawing funds' });
    }
    const amountError = await validateWithdrawalAmount(amount, dbUser.balance);
    if (amountError) return res.status(400).json({ error: amountError });
    const updated = await mutateUser(req.auth!.userId, (u) => {
      const tx: Transaction = {
        id: newId('tx_'),
        type: 'withdrawal',
        amount,
        date: new Date().toISOString(),
        status: 'pending',
      };
      u.balance -= amount;
      u.transactions = [tx, ...(u.transactions || [])];
    });
    res.json(updated);
  })
);

app.post(
  '/api/kyc/submit',
  asyncHandler(requireAuth),
  asyncHandler(async (req, res) => {
    const details = req.body as KycDetails;
    if (!details?.fullName?.trim()) {
      return res.status(400).json({ error: 'KYC details incomplete' });
    }
    const updated = await applyKycSubmit(req.auth!.userId, {
      ...details,
      submittedAt: details.submittedAt || new Date().toISOString(),
    });
    res.json(updated);
  })
);

app.post(
  '/api/investments',
  asyncHandler(requireAuth),
  asyncHandler(async (req, res) => {
    const { planId, planName, amount } = req.body ?? {};
    const dbUser = await findDbUser(req.auth!.userId);
    if (!dbUser) return res.status(404).json({ error: 'User not found' });
    if (!dbUser.isKycVerified && dbUser.kycStatus !== 'verified') {
      return res.status(403).json({ error: 'KYC must be approved by admin before investing' });
    }

    let plan = planId ? await getPlanFromDb(String(planId)) : undefined;
    if (!plan && planName) {
      plan = (await getStore().findPlanByTier(String(planName))) ?? undefined;
    }
    if (!plan) return res.status(400).json({ error: 'Plan not found' });
    if (amount != null && Number(amount) !== plan.amount) {
      return res.status(400).json({ error: 'Amount does not match plan tier' });
    }

    try {
      const updated = await recordInvestment(req.auth!.userId, plan);
      if (!updated) return res.status(400).json({ error: 'Investment failed' });
      res.json(updated);
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Investment failed' });
    }
  })
);

app.post(
  '/api/tickets',
  asyncHandler(requireAuth),
  asyncHandler(async (req, res) => {
    try {
      const ticket = await createSupportTicket(req.auth!.userId, req.body ?? {});
      res.status(201).json(ticket);
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Could not create ticket' });
    }
  })
);

app.get(
  '/api/tickets/mine',
  asyncHandler(requireAuth),
  asyncHandler(async (req, res) => {
    res.json(await getUserSupportTickets(req.auth!.userId));
  })
);

// —— Admin ——
app.get('/api/admin/access', asyncHandler(requireAdmin), (req, res) => {
  res.json(getAdminAccessPayload(req.dbUser!));
});

app.get(
  '/api/admin/team',
  asyncHandler(requireSuperAdmin),
  asyncHandler(async (_req, res) => {
    res.json(await listAdminTeam());
  })
);

app.post(
  '/api/admin/team',
  asyncHandler(requireSuperAdmin),
  asyncHandler(async (req, res) => {
    try {
      const user = await createStaffAdmin(req.auth!.userId, req.body ?? {});
      res.status(201).json(user);
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to create admin' });
    }
  })
);

app.patch(
  '/api/admin/team/:userId',
  asyncHandler(requireSuperAdmin),
  asyncHandler(async (req, res) => {
    try {
      const user = await updateStaffAdmin(req.auth!.userId, req.params.userId, req.body ?? {});
      res.json(user);
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to update admin' });
    }
  })
);

app.delete(
  '/api/admin/team/:userId',
  asyncHandler(requireSuperAdmin),
  asyncHandler(async (req, res) => {
    try {
      const user = await revokeStaffAdmin(req.auth!.userId, req.params.userId);
      res.json(user);
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to revoke admin' });
    }
  })
);

app.get(
  '/api/admin/users',
  asyncHandler(requireAdmin),
  asyncHandler(async (_req, res) => {
    const users = await getStore().listUsers();
    res.json(users.map(toPublicUser));
  })
);

app.post(
  '/api/admin/users/:userId/impersonate',
  asyncHandler(requireAdmin),
  asyncHandler(requireAdminPermission('users')),
  asyncHandler(async (req, res) => {
    const target = await findDbUser(req.params.userId);
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.role === 'admin') {
      return res.status(403).json({ error: 'Cannot open the dashboard as an admin account' });
    }
    if (target.isDeactivated) {
      return res.status(403).json({ error: 'Member account is deactivated' });
    }
    res.json({ token: signToken(target), user: toPublicUser(target) });
  })
);

app.get(
  '/api/admin/inquiries',
  asyncHandler(requireAdmin),
  asyncHandler(requireAdminPermission('inquiries')),
  asyncHandler(async (_req, res) => {
    res.json(await getStore().listInquiries());
  })
);

app.get(
  '/api/admin/stats',
  asyncHandler(requireAdmin),
  asyncHandler(requireAdminPermission('overview')),
  asyncHandler(async (_req, res) => {
    const store = getStore();
    const [users, inquiries, plans, milestones] = await Promise.all([
      store.listUsers(),
      store.listInquiries(),
      store.listPlans(),
      store.listMilestones(),
    ]);
    const members = users.filter((u) => !isAdminUser(u) && u.role !== 'admin');
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

    res.json({
      totalMembers: members.length,
      activeMembers: members.filter((m) => !m.isDeactivated).length,
      deactivatedMembers: members.filter((m) => m.isDeactivated).length,
      pendingKyc: await countPendingKycSubmissions(),
      verifiedKyc: members.filter((m) => m.isKycVerified || m.kycStatus === 'verified').length,
      pendingWithdrawals,
      pendingDeposits: await countPendingDepositRequests(),
      totalWalletBalance,
      totalInvested,
      newInquiries: inquiries.filter((q) => q.status === 'new').length,
      totalInquiries: inquiries.length,
      openSupportTickets: await countOpenSupportTickets(),
      planCount: plans.length,
      milestoneCount: milestones.length,
      depositMode: (await ensurePaymentSettings()).deposits.mode,
    });
  })
);

app.get(
  '/api/admin/payment/settings',
  asyncHandler(requireAdmin),
  asyncHandler(requireAdminPermission('payment_settings')),
  asyncHandler(async (_req, res) => {
    res.json(await getPaymentSettingsFromDb());
  })
);

app.put(
  '/api/admin/payment/settings',
  asyncHandler(requireAdmin),
  asyncHandler(requireAdminPermission('payment_settings')),
  asyncHandler(async (req, res) => {
    const body = req.body as PaymentSettings;
    if (!body?.deposits?.manual || !body?.deposits?.gateway || !body?.withdrawals) {
      return res.status(400).json({ error: 'Invalid payment settings payload' });
    }
    res.json(await savePaymentSettings(body));
  })
);

app.get(
  '/api/admin/deposit/settings',
  asyncHandler(requireAdmin),
  asyncHandler(requireAdminPermission('payment_settings')),
  asyncHandler(async (_req, res) => {
    res.json(await getDepositSettingsFromDb());
  })
);

app.put(
  '/api/admin/deposit/settings',
  asyncHandler(requireAdmin),
  asyncHandler(requireAdminPermission('payment_settings')),
  asyncHandler(async (req, res) => {
    const body = req.body as DepositSettings;
    if (!body?.manual || !body?.gateway) {
      return res.status(400).json({ error: 'Invalid deposit settings payload' });
    }
    const current = await ensurePaymentSettings();
    res.json((await savePaymentSettings({ ...current, deposits: body })).deposits);
  })
);

app.get(
  '/api/admin/deposits/requests',
  asyncHandler(requireAdmin),
  asyncHandler(requireAdminPermission('deposit_requests')),
  asyncHandler(async (req, res) => {
    const status = String(req.query.status || 'all');
    const search = String(req.query.search || '');
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const valid = ['all', 'pending', 'approved', 'rejected'];
    const filter = valid.includes(status) ? (status as 'all' | 'pending' | 'approved' | 'rejected') : 'all';
    res.json(await queryDepositRequests({ status: filter, search, page, pageSize }));
  })
);

app.patch(
  '/api/admin/deposits/:requestId/approve',
  asyncHandler(requireAdmin),
  asyncHandler(requireAdminPermission('deposit_requests')),
  asyncHandler(async (req, res) => {
    const updated = await approveDepositRequest(req.params.requestId, req.dbUser!.email);
    if (!updated) return res.status(404).json({ error: 'Pending deposit request not found' });
    res.json(updated);
  })
);

app.patch(
  '/api/admin/deposits/:requestId/reject',
  asyncHandler(requireAdmin),
  asyncHandler(requireAdminPermission('deposit_requests')),
  asyncHandler(async (req, res) => {
    const reason = String(req.body?.reason ?? '').trim();
    if (!reason) return res.status(400).json({ error: 'Rejection reason is required' });
    if (reason.length > 500) {
      return res.status(400).json({ error: 'Rejection reason must be 500 characters or less' });
    }
    const updated = await rejectDepositRequest(req.params.requestId, reason, req.dbUser!.email);
    if (!updated) return res.status(404).json({ error: 'Pending deposit request not found' });
    res.json(updated);
  })
);

app.get(
  '/api/admin/tickets',
  asyncHandler(requireAdmin),
  asyncHandler(requireAdminPermission('support_tickets')),
  asyncHandler(async (req, res) => {
    const status = String(req.query.status || 'all');
    const search = String(req.query.search || '');
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const valid = ['all', 'open', 'in_progress', 'resolved', 'closed'];
    const filter = valid.includes(status)
      ? (status as 'all' | 'open' | 'in_progress' | 'resolved' | 'closed')
      : 'all';
    res.json(await querySupportTickets({ status: filter, search, page, pageSize }));
  })
);

app.patch(
  '/api/admin/tickets/:ticketId',
  asyncHandler(requireAdmin),
  asyncHandler(requireAdminPermission('support_tickets')),
  asyncHandler(async (req, res) => {
    try {
      const updated = await updateSupportTicket(
        req.params.ticketId,
        req.body ?? {},
        req.dbUser!.email
      );
      if (!updated) return res.status(404).json({ error: 'Ticket not found' });
      res.json(updated);
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Update failed' });
    }
  })
);

app.patch(
  '/api/admin/inquiries/:id',
  asyncHandler(requireAdmin),
  asyncHandler(requireAdminPermission('inquiries')),
  asyncHandler(async (req, res) => {
    const { status } = req.body ?? {};
    const found = await getStore().updateInquiry(req.params.id, { status });
    if (!found) return res.status(404).json({ error: 'Inquiry not found' });
    res.json(found);
  })
);

app.put(
  '/api/admin/plans',
  asyncHandler(requireAdmin),
  asyncHandler(requireAdminPermission('plans')),
  asyncHandler(async (req, res) => {
    const plans = req.body as InvestmentPlan[];
    if (!Array.isArray(plans)) return res.status(400).json({ error: 'Expected plans array' });
    const saved = await getStore().replacePlans(plans);
    res.json(saved);
  })
);

app.put(
  '/api/admin/milestones',
  asyncHandler(requireAdmin),
  asyncHandler(requireAdminPermission('milestones')),
  asyncHandler(async (req, res) => {
    const milestones = req.body as MilestoneTier[];
    if (!Array.isArray(milestones)) return res.status(400).json({ error: 'Expected milestones array' });
    const saved = await getStore().replaceMilestones(milestones);
    res.json(saved);
  })
);

app.get(
  '/api/kyc/history',
  asyncHandler(requireAuth),
  asyncHandler(async (req, res) => {
    const dbUser = await findDbUser(req.auth!.userId);
    if (!dbUser) return res.status(404).json({ error: 'User not found' });
    backfillKycHistory(dbUser);
    const history = [...(dbUser.kycHistory ?? [])].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
    res.json(history);
  })
);

app.patch(
  '/api/admin/users/:userId/kyc/approve',
  asyncHandler(requireAdmin),
  asyncHandler(requireAdminPermission('kyc')),
  asyncHandler(async (req, res) => {
    const updated = await approveLatestKycForUser(req.params.userId, req.dbUser!.email);
    if (!updated) return res.status(404).json({ error: 'No pending KYC submission found' });
    res.json(updated);
  })
);

app.patch(
  '/api/admin/users/:userId/kyc/reject',
  asyncHandler(requireAdmin),
  asyncHandler(requireAdminPermission('kyc')),
  asyncHandler(async (req, res) => {
    const reason = String(req.body?.reason ?? '').trim();
    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    if (reason.length > 500) {
      return res.status(400).json({ error: 'Rejection reason must be 500 characters or less' });
    }
    const updated = await rejectLatestKycForUser(req.params.userId, reason, req.dbUser!.email);
    if (!updated) return res.status(404).json({ error: 'No pending KYC submission found' });
    res.json(updated);
  })
);

app.get(
  '/api/admin/kyc/submissions',
  asyncHandler(requireAdmin),
  asyncHandler(requireAdminPermission('kyc')),
  asyncHandler(async (req, res) => {
    const status = (String(req.query.status || 'all') as KycFilterStatus) || 'all';
    const search = String(req.query.search || '');
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const validStatuses: KycFilterStatus[] = ['all', 'submitted', 'verified', 'rejected'];
    const filter = validStatuses.includes(status) ? status : 'all';
    res.json(await queryKycSubmissions({ status: filter, search, page, pageSize }));
  })
);

app.patch(
  '/api/admin/kyc/submissions/:submissionId/approve',
  asyncHandler(requireAdmin),
  asyncHandler(requireAdminPermission('kyc')),
  asyncHandler(async (req, res) => {
    const updated = await approveKycSubmission(req.params.submissionId, req.dbUser!.email);
    if (!updated) return res.status(404).json({ error: 'Pending submission not found' });
    res.json(updated);
  })
);

app.patch(
  '/api/admin/kyc/submissions/:submissionId/reject',
  asyncHandler(requireAdmin),
  asyncHandler(requireAdminPermission('kyc')),
  asyncHandler(async (req, res) => {
    const reason = String(req.body?.reason ?? '').trim();
    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    if (reason.length > 500) {
      return res.status(400).json({ error: 'Rejection reason must be 500 characters or less' });
    }
    const updated = await rejectKycSubmission(req.params.submissionId, reason, req.dbUser!.email);
    if (!updated) return res.status(404).json({ error: 'Pending submission not found' });
    res.json(updated);
  })
);

app.patch(
  '/api/admin/users/:userId/balance',
  asyncHandler(requireAdmin),
  asyncHandler(requireAdminPermission('users')),
  asyncHandler(async (req, res) => {
    const amount = Number(req.body?.amount);
    const note = String(req.body?.note || 'Admin balance adjustment');
    if (!Number.isFinite(amount) || amount === 0) {
      return res.status(400).json({ error: 'Invalid adjustment amount' });
    }
    const updated = await mutateUser(req.params.userId, (u) => {
      const tx: Transaction = {
        id: newId('tx_'),
        type: amount > 0 ? 'deposit' : 'withdrawal',
        amount: Math.abs(amount),
        date: new Date().toISOString(),
        status: 'completed',
        details: note,
      };
      u.balance = Math.max(0, u.balance + amount);
      u.transactions = [tx, ...(u.transactions || [])];
    });
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  })
);

app.patch(
  '/api/admin/users/:userId/deactivated',
  asyncHandler(requireAdmin),
  asyncHandler(requireAdminPermission('users')),
  asyncHandler(async (req, res) => {
    const deactivated = !!req.body?.deactivated;
    const updated = await mutateUser(req.params.userId, (u) => {
      u.isDeactivated = deactivated;
    });
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  })
);

app.delete(
  '/api/admin/users/:userId',
  asyncHandler(requireAdmin),
  asyncHandler(requireAdminPermission('users')),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const target = await findDbUser(userId);
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.role === 'admin') return res.status(403).json({ error: 'Cannot delete admin account' });
    await getStore().deleteUser(userId);
    res.json({ ok: true });
  })
);

app.patch(
  '/api/admin/withdrawals/:userId/:txId/approve',
  asyncHandler(requireAdmin),
  asyncHandler(requireAdminPermission('withdrawals')),
  asyncHandler(async (req, res) => {
    const updated = await mutateUser(req.params.userId, (u) => {
      u.transactions = (u.transactions || []).map((tx) =>
        tx.id === req.params.txId && tx.type === 'withdrawal' && tx.status === 'pending'
          ? { ...tx, status: 'completed' as const }
          : tx
      );
    });
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  })
);

app.patch(
  '/api/admin/withdrawals/:userId/:txId/reject',
  asyncHandler(requireAdmin),
  asyncHandler(requireAdminPermission('withdrawals')),
  asyncHandler(async (req, res) => {
    const dbUser = await findDbUser(req.params.userId);
    if (!dbUser) return res.status(404).json({ error: 'User not found' });
    const tx = dbUser.transactions?.find((t) => t.id === req.params.txId && t.type === 'withdrawal');
    if (!tx || tx.status !== 'pending') return res.status(400).json({ error: 'Withdrawal not pending' });

    const updated = await mutateUser(req.params.userId, (u) => {
      u.balance += tx.amount;
      u.transactions = (u.transactions || []).map((t) =>
        t.id === req.params.txId
          ? { ...t, status: 'rejected' as const, details: (t.details || '') + ' (rejected by admin)' }
          : t
      );
    });
    res.json(updated);
  })
);

app.post(
  '/api/admin/investments/assign',
  asyncHandler(requireAdmin),
  asyncHandler(requireAdminPermission('investments')),
  asyncHandler(async (req, res) => {
    const { userId, planId } = req.body ?? {};
    const plan = await getPlanFromDb(String(planId));
    if (!plan) return res.status(400).json({ error: 'Plan not found' });
    try {
      const updated = await recordInvestment(String(userId), plan, `${plan.tier} (admin assigned)`);
      if (!updated) return res.status(404).json({ error: 'User not found' });
      res.json(updated);
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Failed' });
    }
  })
);

app.patch(
  '/api/admin/users/:userId/milestones/:milestoneId',
  asyncHandler(requireAdmin),
  asyncHandler(requireAdminPermission('milestones')),
  asyncHandler(async (req, res) => {
    const status = req.body?.status as 'eligible' | 'fulfilled' | null;
    const updated = await mutateUser(req.params.userId, (u) => {
      const next = { ...(u.milestoneFulfillment || {}) };
      if (status === null) delete next[req.params.milestoneId];
      else next[req.params.milestoneId] = status;
      u.milestoneFulfillment = next;
    });
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  })
);

app.get(
  '/api/admin/export',
  asyncHandler(requireAdmin),
  asyncHandler(requireAdminPermission('users')),
  asyncHandler(async (_req, res) => {
    const snapshot = await getStore().exportSnapshot();
    res.json({
      users: snapshot.users.map(toPublicUser),
      plans: snapshot.plans,
      milestones: snapshot.milestones,
      inquiries: snapshot.inquiries,
      depositSettings: snapshot.depositSettings,
      paymentSettings: snapshot.paymentSettings,
      depositRequests: snapshot.depositRequests,
    });
  })
);

app.post(
  '/api/admin/import/users',
  asyncHandler(requireAdmin),
  asyncHandler(requireAdminPermission('users')),
  asyncHandler(async (req, res) => {
    const users = req.body?.users;
    if (!Array.isArray(users)) return res.status(400).json({ error: 'Expected { users: [] }' });
    const store = getStore();
    const existing = await store.listUsers();
    const byId = new Map(existing.map((u) => [u.id, u]));
    const toSave: DbUser[] = [];
    for (const pub of users) {
      const row = byId.get(pub.id);
      if (row) {
        const { passwordHash } = row;
        toSave.push({ ...row, ...pub, passwordHash });
      }
    }
    await store.upsertUsers(toSave);
    const count = (await store.listUsers()).length;
    res.json({ count });
  })
);

if (serveStatic) {
  app.use(express.static(staticRoot));
  app.get('/admin/*', (_req, res) => {
    res.sendFile(path.join(staticRoot, 'admin/index.html'));
  });
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(staticRoot, 'index.html'));
  });
}

let httpServer: ReturnType<typeof app.listen> | null = null;

async function shutdown(signal: string): Promise<void> {
  console.log(`[api] ${signal} received, closing store…`);
  try {
    if (httpServer) {
      await new Promise<void>((resolve) => httpServer!.close(() => resolve()));
      httpServer = null;
    }
    await closeStore();
  } catch (err) {
    console.error('[api] Shutdown error:', err);
  }
  process.exit(0);
}

async function start() {
  await initStore();
  await initDb();
  httpServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Gaulaxmi API listening on http://localhost:${PORT}`);
  });
  httpServer.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[api] Port ${PORT} is already in use. Stop the other process or run: node scripts/free-port.mjs ${PORT}`);
    } else {
      console.error('[api] Server error:', err);
    }
    process.exit(1);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

start().catch((err) => {
  console.error('Failed to start API:', err);
  process.exit(1);
});
