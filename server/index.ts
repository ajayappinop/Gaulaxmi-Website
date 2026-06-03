import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './initDb.js';
import { readDb, updateDb, writeDb } from './db.js';
import { requireAuth, requireAdmin, signToken } from './middleware/auth.js';
import {
  findDbUser,
  findDbUserByEmail,
  mutateUser,
  getPlanFromDb,
  recordInvestment,
  buildPlanFromBody,
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
app.get('/api/plans', (_req, res) => {
  const { plans } = readDb();
  res.json(plans.length ? plans : DEFAULT_PLANS);
});

app.get('/api/milestones', (_req, res) => {
  res.json(readDb().milestones);
});

app.post('/api/inquiries', (req, res) => {
  const { fullname, phone, email, planId, message } = req.body ?? {};
  if (!fullname?.trim() || !phone?.trim() || !planId) {
    return res.status(400).json({ error: 'Name, phone, and plan are required' });
  }
  const db = readDb();
  const plan = db.plans.find((p) => p.id === planId);
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
  updateDb((d) => {
    d.inquiries.unshift(inquiry);
  });
  res.status(201).json(inquiry);
});

// —— Auth ——
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body ?? {};
  if (!name?.trim() || !email?.trim() || !password || String(password).length < 6) {
    return res.status(400).json({ error: 'Valid name, email, and password (6+ chars) required' });
  }
  const normalized = normalizeEmail(email);
  if (findDbUserByEmail(normalized)) {
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
  updateDb((db) => db.users.push(newUser));
  const token = signToken(newUser);
  res.status(201).json({ token, user: toPublicUser(newUser) });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email?.trim() || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const user = findDbUserByEmail(normalizeEmail(email));
  if (!user) return res.status(401).json({ error: 'No account found for this email' });
  if (user.isDeactivated) return res.status(403).json({ error: 'Account deactivated' });
  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Incorrect password' });
  const token = signToken(user);
  res.json({ token, user: toPublicUser(user) });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json(req.publicUser);
});

app.patch('/api/auth/profile', requireAuth, (req, res) => {
  const { name, email, phone, profileImage } = req.body ?? {};
  const updated = mutateUser(req.auth!.userId, (u) => {
    if (name) u.name = String(name).trim();
    if (email) u.email = normalizeEmail(email);
    if (phone !== undefined) u.phone = String(phone);
    if (profileImage !== undefined) u.profileImage = profileImage;
  });
  if (!updated) return res.status(404).json({ error: 'User not found' });
  res.json(updated);
});

app.patch('/api/auth/password', requireAuth, async (req, res) => {
  const { password } = req.body ?? {};
  if (!password || String(password).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const hash = await bcrypt.hash(String(password), 10);
  const updated = mutateUser(req.auth!.userId, (u) => {
    u.passwordHash = hash;
  });
  if (!updated) return res.status(404).json({ error: 'User not found' });
  res.json({ ok: true });
});

app.delete('/api/auth/account', requireAuth, (req, res) => {
  updateDb((db) => {
    db.users = db.users.filter((u) => u.id !== req.auth!.userId);
  });
  res.json({ ok: true });
});

app.post('/api/auth/deactivate', requireAuth, (req, res) => {
  mutateUser(req.auth!.userId, (u) => {
    u.isDeactivated = true;
  });
  res.json({ ok: true });
});

// —— Member wallet & invest ——
app.post('/api/wallet/deposit', requireAuth, (req, res) => {
  const amount = Number(req.body?.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid deposit amount' });
  }
  const dbUser = findDbUser(req.auth!.userId);
  if (!dbUser) return res.status(404).json({ error: 'User not found' });
  if (!isKycVerifiedUser(dbUser)) {
    return res.status(403).json({ error: 'KYC must be approved by admin before depositing funds' });
  }
  const updated = mutateUser(req.auth!.userId, (u) => {
    const tx: Transaction = {
      id: newId('tx_'),
      type: 'deposit',
      amount,
      date: new Date().toISOString(),
      status: 'completed',
    };
    u.balance += amount;
    u.transactions = [tx, ...(u.transactions || [])];
  });
  res.json(updated);
});

app.post('/api/wallet/withdraw', requireAuth, (req, res) => {
  const amount = Number(req.body?.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid withdrawal amount' });
  }
  const dbUser = findDbUser(req.auth!.userId);
  if (!dbUser || dbUser.balance < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  if (!isKycVerifiedUser(dbUser)) {
    return res.status(403).json({ error: 'KYC must be approved by admin before withdrawing funds' });
  }
  const updated = mutateUser(req.auth!.userId, (u) => {
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
});

app.post('/api/kyc/submit', requireAuth, (req, res) => {
  const details = req.body as KycDetails;
  if (!details?.fullName?.trim()) {
    return res.status(400).json({ error: 'KYC details incomplete' });
  }
  const userId = req.auth!.userId;
  const updated = applyKycSubmit(userId, {
    ...details,
    submittedAt: details.submittedAt || new Date().toISOString(),
  });
  res.json(updated);
});

app.post('/api/investments', requireAuth, (req, res) => {
  const { planId, planName, amount } = req.body ?? {};
  const dbUser = findDbUser(req.auth!.userId);
  if (!dbUser) return res.status(404).json({ error: 'User not found' });
  if (!dbUser.isKycVerified && dbUser.kycStatus !== 'verified') {
    return res.status(403).json({ error: 'KYC must be approved by admin before investing' });
  }

  let plan = planId ? getPlanFromDb(String(planId)) : undefined;
  if (!plan && planName) {
    plan = readDb().plans.find((p) => p.tier.toLowerCase() === String(planName).toLowerCase());
  }
  if (!plan) return res.status(400).json({ error: 'Plan not found' });
  if (amount != null && Number(amount) !== plan.amount) {
    return res.status(400).json({ error: 'Amount does not match plan tier' });
  }

  try {
    const updated = recordInvestment(req.auth!.userId, plan);
    if (!updated) return res.status(400).json({ error: 'Investment failed' });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Investment failed' });
  }
});

// —— Admin ——
app.get('/api/admin/users', requireAdmin, (_req, res) => {
  const users = readDb().users.map(toPublicUser);
  res.json(users);
});

app.get('/api/admin/inquiries', requireAdmin, (_req, res) => {
  res.json(readDb().inquiries);
});

app.get('/api/admin/stats', requireAdmin, (_req, res) => {
  const db = readDb();
  const members = db.users.filter((u) => !isAdminUser(u) && u.role !== 'admin');
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

  const inquiries = db.inquiries || [];
  res.json({
    totalMembers: members.length,
    activeMembers: members.filter((m) => !m.isDeactivated).length,
    deactivatedMembers: members.filter((m) => m.isDeactivated).length,
    pendingKyc: countPendingKycSubmissions(),
    verifiedKyc: members.filter((m) => m.isKycVerified || m.kycStatus === 'verified').length,
    pendingWithdrawals,
    totalWalletBalance,
    totalInvested,
    newInquiries: inquiries.filter((q) => q.status === 'new').length,
    totalInquiries: inquiries.length,
    planCount: db.plans.length,
    milestoneCount: db.milestones.length,
  });
});

app.patch('/api/admin/inquiries/:id', requireAdmin, (req, res) => {
  const { status } = req.body ?? {};
  let found: ContactInquiry | undefined;
  updateDb((db) => {
    const idx = db.inquiries.findIndex((q) => q.id === req.params.id);
    if (idx === -1) return;
    db.inquiries[idx] = { ...db.inquiries[idx], status };
    found = db.inquiries[idx];
  });
  if (!found) return res.status(404).json({ error: 'Inquiry not found' });
  res.json(found);
});

app.put('/api/admin/plans', requireAdmin, (req, res) => {
  const plans = req.body as InvestmentPlan[];
  if (!Array.isArray(plans)) return res.status(400).json({ error: 'Expected plans array' });
  updateDb((db) => {
    db.plans = plans.sort((a, b) => a.amount - b.amount);
  });
  res.json(readDb().plans);
});

app.put('/api/admin/milestones', requireAdmin, (req, res) => {
  const milestones = req.body as MilestoneTier[];
  if (!Array.isArray(milestones)) return res.status(400).json({ error: 'Expected milestones array' });
  updateDb((db) => {
    db.milestones = milestones.sort((a, b) => a.minInvest - b.minInvest);
  });
  res.json(readDb().milestones);
});

app.get('/api/kyc/history', requireAuth, (req, res) => {
  const dbUser = findDbUser(req.auth!.userId);
  if (!dbUser) return res.status(404).json({ error: 'User not found' });
  backfillKycHistory(dbUser);
  const history = [...(dbUser.kycHistory ?? [])].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
  res.json(history);
});

app.patch('/api/admin/users/:userId/kyc/approve', requireAdmin, (req, res) => {
  const updated = approveLatestKycForUser(req.params.userId, req.dbUser!.email);
  if (!updated) return res.status(404).json({ error: 'No pending KYC submission found' });
  res.json(updated);
});

app.patch('/api/admin/users/:userId/kyc/reject', requireAdmin, (req, res) => {
  const reason = String(req.body?.reason ?? '').trim();
  if (!reason) {
    return res.status(400).json({ error: 'Rejection reason is required' });
  }
  if (reason.length > 500) {
    return res.status(400).json({ error: 'Rejection reason must be 500 characters or less' });
  }
  const updated = rejectLatestKycForUser(req.params.userId, reason, req.dbUser!.email);
  if (!updated) return res.status(404).json({ error: 'No pending KYC submission found' });
  res.json(updated);
});

app.get('/api/admin/kyc/submissions', requireAdmin, (req, res) => {
  const status = (String(req.query.status || 'all') as KycFilterStatus) || 'all';
  const search = String(req.query.search || '');
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const validStatuses: KycFilterStatus[] = ['all', 'submitted', 'verified', 'rejected'];
  const filter = validStatuses.includes(status) ? status : 'all';
  res.json(queryKycSubmissions({ status: filter, search, page, pageSize }));
});

app.patch('/api/admin/kyc/submissions/:submissionId/approve', requireAdmin, (req, res) => {
  const updated = approveKycSubmission(req.params.submissionId, req.dbUser!.email);
  if (!updated) return res.status(404).json({ error: 'Pending submission not found' });
  res.json(updated);
});

app.patch('/api/admin/kyc/submissions/:submissionId/reject', requireAdmin, (req, res) => {
  const reason = String(req.body?.reason ?? '').trim();
  if (!reason) {
    return res.status(400).json({ error: 'Rejection reason is required' });
  }
  if (reason.length > 500) {
    return res.status(400).json({ error: 'Rejection reason must be 500 characters or less' });
  }
  const updated = rejectKycSubmission(req.params.submissionId, reason, req.dbUser!.email);
  if (!updated) return res.status(404).json({ error: 'Pending submission not found' });
  res.json(updated);
});

app.patch('/api/admin/users/:userId/balance', requireAdmin, (req, res) => {
  const amount = Number(req.body?.amount);
  const note = String(req.body?.note || 'Admin balance adjustment');
  if (!Number.isFinite(amount) || amount === 0) {
    return res.status(400).json({ error: 'Invalid adjustment amount' });
  }
  const updated = mutateUser(req.params.userId, (u) => {
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
});

app.patch('/api/admin/users/:userId/deactivated', requireAdmin, (req, res) => {
  const deactivated = !!req.body?.deactivated;
  const updated = mutateUser(req.params.userId, (u) => {
    u.isDeactivated = deactivated;
  });
  if (!updated) return res.status(404).json({ error: 'User not found' });
  res.json(updated);
});

app.delete('/api/admin/users/:userId', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const db = readDb();
  const target = db.users.find((u) => u.id === userId);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (isAdminUser(target)) return res.status(403).json({ error: 'Cannot delete admin account' });
  updateDb((d) => {
    d.users = d.users.filter((u) => u.id !== userId);
  });
  res.json({ ok: true });
});

app.patch('/api/admin/withdrawals/:userId/:txId/approve', requireAdmin, (req, res) => {
  const updated = mutateUser(req.params.userId, (u) => {
    u.transactions = (u.transactions || []).map((tx) =>
      tx.id === req.params.txId && tx.type === 'withdrawal' && tx.status === 'pending'
        ? { ...tx, status: 'completed' as const }
        : tx
    );
  });
  if (!updated) return res.status(404).json({ error: 'User not found' });
  res.json(updated);
});

app.patch('/api/admin/withdrawals/:userId/:txId/reject', requireAdmin, (req, res) => {
  const dbUser = findDbUser(req.params.userId);
  if (!dbUser) return res.status(404).json({ error: 'User not found' });
  const tx = dbUser.transactions?.find((t) => t.id === req.params.txId && t.type === 'withdrawal');
  if (!tx || tx.status !== 'pending') return res.status(400).json({ error: 'Withdrawal not pending' });

  const updated = mutateUser(req.params.userId, (u) => {
    u.balance += tx.amount;
    u.transactions = (u.transactions || []).map((t) =>
      t.id === req.params.txId
        ? { ...t, status: 'rejected' as const, details: (t.details || '') + ' (rejected by admin)' }
        : t
    );
  });
  res.json(updated);
});

app.post('/api/admin/investments/assign', requireAdmin, (req, res) => {
  const { userId, planId } = req.body ?? {};
  const plan = getPlanFromDb(String(planId));
  if (!plan) return res.status(400).json({ error: 'Plan not found' });
  try {
    const updated = recordInvestment(String(userId), plan, `${plan.tier} (admin assigned)`);
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed' });
  }
});

app.patch('/api/admin/users/:userId/milestones/:milestoneId', requireAdmin, (req, res) => {
  const status = req.body?.status as 'eligible' | 'fulfilled' | null;
  const updated = mutateUser(req.params.userId, (u) => {
    const next = { ...(u.milestoneFulfillment || {}) };
    if (status === null) delete next[req.params.milestoneId];
    else next[req.params.milestoneId] = status;
    u.milestoneFulfillment = next;
  });
  if (!updated) return res.status(404).json({ error: 'User not found' });
  res.json(updated);
});

// Admin export/import full database snapshot (users public only on export)
app.get('/api/admin/export', requireAdmin, (_req, res) => {
  const db = readDb();
  res.json({
    users: db.users.map(toPublicUser),
    plans: db.plans,
    milestones: db.milestones,
    inquiries: db.inquiries,
  });
});

app.post('/api/admin/import/users', requireAdmin, (req, res) => {
  const users = req.body?.users;
  if (!Array.isArray(users)) return res.status(400).json({ error: 'Expected { users: [] }' });
  updateDb((db) => {
    const byId = new Map(db.users.map((u) => [u.id, u]));
    for (const pub of users) {
      const existing = byId.get(pub.id);
      if (existing) {
        const { passwordHash } = existing;
        byId.set(pub.id, { ...existing, ...pub, passwordHash });
      }
    }
    db.users = Array.from(byId.values());
  });
  res.json({ count: readDb().users.length });
});

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

async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Gaulaxmi API listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start API:', err);
  process.exit(1);
});
