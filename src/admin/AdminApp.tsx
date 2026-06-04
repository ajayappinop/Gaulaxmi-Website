import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth, type User } from '../lib/auth';
import {
  type AdminTabId,
  isAdminUser,
  exportAccountsJson,
  importAccountsJson,
} from '../lib/admin';
import {
  computeOverviewStats,
  flattenInvestments,
  flattenTransactions,
  getMemberAccounts,
  getPendingWithdrawals,
} from '../lib/adminStats';
import { updateInquiryStatus, type ContactInquiry } from '../lib/inquiries';
import { formatINR } from '../lib/plans';
import { fetchAdminCatalog } from '../lib/adminData';
import { api } from '../lib/apiClient';
import { describeApiError, waitForApiHealth } from '../lib/apiReachable';
import type { InvestmentPlan, MilestoneTier } from '../../shared/types';
import { PlansAdminTab } from './tabs/PlansAdminTab';
import { MilestonesAdminTab } from './tabs/MilestonesAdminTab';
import { KycAdminTab } from './tabs/KycAdminTab';
import { DepositRequestsAdminTab } from './tabs/DepositRequestsAdminTab';
import { SupportTicketsAdminTab } from './tabs/SupportTicketsAdminTab';
import { AdminTeamTab } from './tabs/AdminTeamTab';
import {
  canAccessAdminTab,
  filterAdminNavSections,
  firstAllowedAdminTab,
  isSuperAdminUser,
} from '../lib/adminPermissions';
import { PaymentSettingsAdminTab } from './tabs/PaymentSettingsAdminTab';
import { UsersListTab } from './tabs/UsersListTab';
import { MemberDetailTab } from './tabs/MemberDetailTab';
import { AdminTransactionDetailModal } from './components/AdminTransactionDetailModal';
import { AdminWithdrawalDetailModal } from './components/AdminWithdrawalDetailModal';
import { AdminInvestmentDetailModal } from './components/AdminInvestmentDetailModal';
import { AdminDetailsButton } from './components/AdminDetailsButton';
import { AdminTableToolbar, adminTableControlProps } from './components/AdminTableToolbar';
import { memberHasActivityInRange, memberLatestActivityDate } from '../lib/tableControls';
import {
  AdminTable,
  AdminTableCard,
  AdminThead,
  AdminTbody,
  AdminTr,
  AdminTh,
  AdminTd,
  AdminEmptyRow,
  AdminMemberCell,
  AdminMoney,
  AdminBadge,
  kycBadgeTone,
  AdminActionLink,
  AdminRowActions,
} from './components/AdminDataTable';
import { useAdminTable } from './hooks/useAdminTable';
import { AdminStatCard } from './components/AdminStatCard';
import { AdminPageHeader } from './components/AdminPageHeader';
import { AdminConfirmDialog } from './components/AdminConfirmDialog';
import { AdminSidebar } from './components/AdminSidebar';
import { adminShell, adminTypography } from './adminTheme';
import { OverviewCharts } from './components/OverviewCharts';
import { OverviewDateRangeFilter } from './components/OverviewDateRangeFilter';
import { defaultLast30DaysFilter, getDateFilterLabel } from '../lib/tableControls';
import { buildPeriodMetrics, type OverviewDateFilter } from '../lib/adminOverviewCharts';
import { toast } from 'react-hot-toast';
import logo from '../assets/Images/gaulaxmi-logo.png';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  TrendingUp,
  Mail,
  RefreshCw,
  Menu,
  Download,
  Upload,
  Wallet,
  LifeBuoy,
} from 'lucide-react';

const ADMIN_SESSION_KEY = 'gaulaxmi_admin_session';

export function AdminApp() {
  const auth = useAuth();
  const [tab, setTab] = useState<AdminTabId>('overview');
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [catalogPlans, setCatalogPlans] = useState<InvestmentPlan[]>([]);
  const [catalogMilestones, setCatalogMilestones] = useState<MilestoneTier[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [memberDetailId, setMemberDetailId] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [balanceAdjust, setBalanceAdjust] = useState({ amount: '', note: '' });
  const [adminUnlocked, setAdminUnlocked] = useState(
    () => localStorage.getItem(ADMIN_SESSION_KEY) === '1'
  );

  const isAdminSession = auth.isLoggedIn && isAdminUser(auth.user) && adminUnlocked;

  const navSections = useMemo(
    () => filterAdminNavSections(auth.user),
    [auth.user]
  );

  const members = useMemo(() => getMemberAccounts(auth.allUsers), [auth.allUsers]);
  const [serverStats, setServerStats] = useState<ReturnType<typeof computeOverviewStats> | null>(null);

  const stats = useMemo(
    () => serverStats ?? computeOverviewStats(auth.allUsers, inquiries),
    [serverStats, auth.allUsers, inquiries]
  );

  const refreshAll = async () => {
    setSyncing(true);
    try {
      const apiUp = await waitForApiHealth();
      if (!apiUp) {
        toast.error(
          'API is not running on port 4000. Use npm run dev:admin or npm run dev:all from the project folder.'
        );
        return;
      }
      await auth.refreshUsers();
      const [catalog, apiStats] = await Promise.all([fetchAdminCatalog(), api.getAdminStats()]);
      setCatalogPlans(catalog.plans);
      setCatalogMilestones(catalog.milestones);
      setInquiries(catalog.inquiries);
      setServerStats({
        totalMembers: apiStats.totalMembers,
        activeMembers: apiStats.activeMembers,
        deactivatedMembers: apiStats.deactivatedMembers,
        pendingKyc: apiStats.pendingKyc,
        verifiedKyc: apiStats.verifiedKyc,
        pendingWithdrawals: apiStats.pendingWithdrawals,
        pendingDeposits: apiStats.pendingDeposits,
        totalWalletBalance: apiStats.totalWalletBalance,
        totalInvested: apiStats.totalInvested,
        newInquiries: apiStats.newInquiries,
        totalInquiries: apiStats.totalInquiries,
        openSupportTickets: apiStats.openSupportTickets ?? 0,
      });
    } catch (err) {
      toast.error(describeApiError(err));
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (isAdminSession) refreshAll();
  }, [isAdminSession]);

  useEffect(() => {
    if (auth.loading) return;
    if (auth.isLoggedIn && isAdminUser(auth.user)) {
      localStorage.setItem(ADMIN_SESSION_KEY, '1');
      setAdminUnlocked(true);
    }
  }, [auth.loading, auth.isLoggedIn, auth.user]);

  useEffect(() => {
    if (!isAdminSession || !auth.user) return;
    if (!canAccessAdminTab(auth.user, tab)) {
      setTab(firstAllowedAdminTab(auth.user));
    }
  }, [tab, isAdminSession, auth.user]);

  useEffect(() => {
    if (tab !== 'users') setMemberDetailId(null);
  }, [tab]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [tab]);

  const memberDetailUser = members.find((u) => u.id === memberDetailId) ?? null;

  const openMemberDetail = useCallback((userId: string) => {
    setTab('users');
    setMemberDetailId(userId);
  }, []);

  const handleAdminLogin = async (email: string, password: string) => {
    const result = await auth.login(email, password);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    if (!isAdminUser(result.user)) {
      auth.logout();
      toast.error(
        'This account does not have admin access. Contact the super admin to assign permissions.'
      );
      return;
    }
    localStorage.setItem(ADMIN_SESSION_KEY, '1');
    setAdminUnlocked(true);
    toast.success('Welcome to Gaulaxmi Admin');
    await refreshAll();
  };

  const handleAdminLogout = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setAdminUnlocked(false);
    auth.logout();
  };

  if (!isAdminSession) {
    return <AdminLoginForm onLogin={handleAdminLogin} />;
  }

  return (
    <div className={adminShell.root}>
      <AdminSidebar
        tab={tab}
        stats={stats}
        navSections={navSections}
        adminEmail={auth.user?.email}
        onSelectTab={setTab}
        onLogout={handleAdminLogout}
        mobileOpen={mobileNavOpen}
        onMobileOpenChange={setMobileNavOpen}
      />

      <div className={adminShell.mainWrap}>
        <header className={adminShell.header}>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <img src={logo} alt="Gaulaxmi" className="h-8 w-8 object-contain shrink-0 lg:hidden" />
            <div className="min-w-0 hidden sm:block lg:hidden">
              <p className="font-display text-sm font-bold text-primary truncate">Gaulaxmi Admin</p>
            </div>
            <p className="hidden lg:block text-sm text-stone-500 truncate">
              Signed in as <span className="text-stone-900 font-medium">{auth.user?.email}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refreshAll()}
            disabled={syncing}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-sm font-semibold text-stone-700 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </header>

        <main className={adminShell.main}>
          <DataSyncBanner users={auth.allUsers} onImported={() => void refreshAll()} />

          {tab === 'overview' && (
            <OverviewTab
              stats={stats}
              members={members}
              users={auth.allUsers}
              inquiries={inquiries}
              plans={catalogPlans}
              onNavigate={setTab}
              onViewMember={openMemberDetail}
            />
          )}

          {tab === 'users' &&
            (memberDetailUser ? (
              <MemberDetailTab
                user={memberDetailUser}
                onBack={() => setMemberDetailId(null)}
                balanceAdjust={balanceAdjust}
                onBalanceAdjustChange={setBalanceAdjust}
                onAdjustBalance={async (userId, amount, note) => {
                  await auth.adminAdjustBalance(userId, amount, note);
                  await refreshAll();
                  toast.success('Balance updated');
                }}
                onDeactivate={async (userId, v) => {
                  await auth.adminSetDeactivated(userId, v);
                  await refreshAll();
                  toast.success(v ? 'User deactivated' : 'User reactivated');
                }}
                onRemove={async (userId) => {
                  await auth.adminRemoveUser(userId);
                  await refreshAll();
                  toast.success('User removed');
                }}
              />
            ) : (
              <UsersListTab members={members} onViewMember={openMemberDetail} />
            ))}

          {tab === 'kyc' && (
            <KycAdminTab
              onViewMember={openMemberDetail}
              onApprove={async (submissionId) => {
                await auth.adminApproveKycSubmission(submissionId);
                await refreshAll();
                toast.success('KYC approved');
              }}
              onReject={async (submissionId, reason) => {
                await auth.adminRejectKycSubmission(submissionId, reason);
                await refreshAll();
                toast.success('KYC rejected');
              }}
            />
          )}

          {tab === 'payment_settings' && <PaymentSettingsAdminTab />}

          {tab === 'deposit_requests' && (
            <DepositRequestsAdminTab
              onViewMember={openMemberDetail}
              onApprove={async (requestId) => {
                await auth.adminApproveDeposit(requestId);
                await refreshAll();
                toast.success('Deposit approved — wallet credited');
              }}
              onReject={async (requestId, reason) => {
                await auth.adminRejectDeposit(requestId, reason);
                await refreshAll();
                toast.success('Deposit rejected');
              }}
            />
          )}

          {tab === 'withdrawals' && (
            <WithdrawalsTab
              rows={getPendingWithdrawals(auth.allUsers)}
              onViewMember={openMemberDetail}
              onApprove={async (userId, txId) => {
                await auth.adminApproveWithdrawal(userId, txId);
                await refreshAll();
                toast.success('Withdrawal approved');
              }}
              onReject={async (userId, txId) => {
                await auth.adminRejectWithdrawal(userId, txId);
                await refreshAll();
                toast.success('Withdrawal rejected — funds returned');
              }}
            />
          )}

          {tab === 'transactions' && (
            <TransactionsTab
              rows={flattenTransactions(auth.allUsers).filter(
                (t) => t.type === 'deposit' || t.type === 'withdrawal'
              )}
              onViewMember={openMemberDetail}
            />
          )}

          {tab === 'plans' && (
            <PlansAdminTab users={auth.allUsers} plans={catalogPlans} onRefresh={refreshAll} />
          )}

          {tab === 'investments' && (
            <InvestmentsTab
              rows={flattenInvestments(auth.allUsers)}
              members={getMemberAccounts(auth.allUsers)}
              plans={catalogPlans}
              onRefresh={refreshAll}
              onViewMember={openMemberDetail}
            />
          )}

          {tab === 'milestones' && (
            <MilestonesAdminTab
              users={auth.allUsers}
              milestones={catalogMilestones}
              onSetFulfillment={auth.adminSetMilestoneFulfillment}
              onRefresh={refreshAll}
              onViewMember={openMemberDetail}
            />
          )}

          {tab === 'inquiries' && (
            <InquiriesTab
              inquiries={inquiries}
              onStatusChange={async (id, status) => {
                await updateInquiryStatus(id, status);
                await refreshAll();
                toast.success('Inquiry updated');
              }}
            />
          )}

          {tab === 'support_tickets' && (
            <SupportTicketsAdminTab onViewMember={openMemberDetail} />
          )}

          {tab === 'admins' && auth.user && isSuperAdminUser(auth.user) && (
            <AdminTeamTab currentUserId={auth.user.id} />
          )}
        </main>
      </div>
    </div>
  );
}

function AdminLoginForm({ onLogin }: { onLogin: (email: string, pass: string) => void }) {
  const [email, setEmail] = useState('admin@gaulaxmi.io');
  const [password, setPassword] = useState('');

  return (
    <div
      className={`${adminShell.root} flex min-h-screen min-h-[100dvh] w-full items-center justify-center p-4 sm:p-6 bg-gradient-warm`}
    >
      <div className="w-full max-w-md mx-auto bg-white border border-stone-200 rounded-3xl p-8 sm:p-10 shadow-soft">
        <div className="flex flex-col items-center text-center mb-6">
          <img src={logo} alt="Gaulaxmi" className="h-16 w-16 object-contain mb-3" />
          <p className={`${adminTypography.brandEyebrow} mb-1`}>Gaulaxmi</p>
          <h1 className="admin-page-title mb-1">Admin Console</h1>
          <p className="admin-page-desc">Manage members, KYC, withdrawals, and leads.</p>
        </div>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onLogin(email, password);
          }}
        >
          <div>
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-900 outline-none focus:border-[#7f4e1c] focus:ring-2 focus:ring-[#7f4e1c]/10"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-900 outline-none focus:border-[#7f4e1c] focus:ring-2 focus:ring-[#7f4e1c]/10"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#7f4e1c] hover:bg-[#633a11] text-white font-semibold py-3 rounded-xl transition shadow-sm"
          >
            Sign in to Admin
          </button>
        </form>
        <p className={`mt-6 ${adminTypography.meta} leading-relaxed text-center`}>
          Demo: <code className="text-[#7f4e1c] font-semibold">admin@gaulaxmi.io</code> /{' '}
          <code className="text-[#7f4e1c] font-semibold">admin123</code>
          <br />
          Member site at <strong className="text-stone-600">localhost:3000</strong> · Admin at{' '}
          <strong className="text-stone-600">localhost:3001</strong>
        </p>
      </div>
    </div>
  );
}

function DataSyncBanner({ users, onImported }: { users: User[]; onImported: () => void }) {
  const handleExportAccounts = () => {
    const blob = new Blob([exportAccountsJson(users)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gaulaxmi_accounts.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Accounts exported');
  };

  const handleExportFull = async () => {
    try {
      const data = await api.getAdminExport();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gaulaxmi_full_backup.json';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Full backup exported (users, plans, milestones, inquiries)');
    } catch {
      toast.error('Full export failed — ensure API is running and you are signed in as admin');
    }
  };

  const handleImport = async () => {
    const json = window.prompt('Paste exported accounts JSON (merge into server database):');
    if (!json) return;
    const result = await importAccountsJson(json);
    if (!result.ok) {
      toast.error('message' in result ? result.message : 'Import failed');
      return;
    }
    onImported();
    toast.success(`Merged ${result.count} accounts on server`);
  };

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-[#f8f1e8] px-4 py-3 text-xs text-[#7b4b1d] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <p>
        <strong className="text-[#7f4e1c]">Backup:</strong> Export or merge member account snapshots in the shared API database (
        <code className="text-[#9a5f23]/80">server/data/database.json</code>).
      </p>
      <div className="flex flex-wrap gap-2 shrink-0">
        <button type="button" onClick={handleExportAccounts} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-700">
          <Download className="w-3.5 h-3.5" /> Users
        </button>
        <button type="button" onClick={() => void handleExportFull()} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-700">
          <Download className="w-3.5 h-3.5" /> Full backup
        </button>
        <button type="button" onClick={handleImport} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#7f4e1c] hover:bg-[#633a11] text-xs font-semibold text-white">
          <Upload className="w-3.5 h-3.5" /> Import users
        </button>
      </div>
    </div>
  );
}

function OverviewTab({
  stats,
  members,
  users,
  inquiries,
  plans,
  onNavigate,
  onViewMember,
}: {
  stats: ReturnType<typeof computeOverviewStats>;
  members: User[];
  users: User[];
  inquiries: ContactInquiry[];
  plans: InvestmentPlan[];
  onNavigate: (t: AdminTabId) => void;
  onViewMember: (userId: string) => void;
}) {
  const [overviewDateFilter, setOverviewDateFilter] = useState<OverviewDateFilter>(
    defaultLast30DaysFilter
  );

  const periodKpis = useMemo(() => {
    const members = getMemberAccounts(users);
    return {
      metrics: buildPeriodMetrics(members, inquiries, overviewDateFilter),
      rangeLabel: getDateFilterLabel(overviewDateFilter),
    };
  }, [users, inquiries, overviewDateFilter]);

  const periodCards = [
    {
      label: 'Transactions',
      value: String(periodKpis.metrics.txCount),
      icon: Receipt,
      tone: 'brown' as const,
      tab: 'transactions' as const,
    },
    {
      label: 'Deposits',
      value: formatINR(periodKpis.metrics.deposits),
      icon: ArrowDownRight,
      tone: 'emerald' as const,
      tab: 'transactions' as const,
    },
    {
      label: 'Withdrawals',
      value: formatINR(periodKpis.metrics.withdrawals),
      icon: ArrowUpRight,
      tone: 'rose' as const,
      tab: 'transactions' as const,
    },
    {
      label: 'Investments (tx)',
      value: formatINR(periodKpis.metrics.investments),
      icon: TrendingUp,
      tone: 'gold' as const,
      tab: 'investments' as const,
    },
    {
      label: 'Plan purchases',
      value: String(periodKpis.metrics.investmentCount),
      icon: TrendingUp,
      tone: 'violet' as const,
      tab: 'investments' as const,
    },
    {
      label: 'Lead inquiries',
      value: String(periodKpis.metrics.inquiryCount),
      icon: Mail,
      tone: 'sky' as const,
      tab: 'inquiries' as const,
    },
  ];

  const memberTable = useAdminTable({
    items: members,
    pageSize: 8,
    searchFn: (m, q) =>
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q),
    filterFn: (m, f) => {
      if (f === 'active') return !m.isDeactivated;
      if (f === 'deactivated') return !!m.isDeactivated;
      if (f === 'kyc_pending') return m.kycStatus === 'submitted';
      if (f === 'kyc_verified') return m.kycStatus === 'verified' || !!m.isKycVerified;
      return true;
    },
    dateFilterFn: (m, start, end) => memberHasActivityInRange(m, start, end),
    getSortValue: (m) => memberLatestActivityDate(m) ?? m.name.toLowerCase(),
  });

  const cards = [
    {
      label: 'Total members',
      value: stats.totalMembers,
      icon: Users,
      tab: 'users' as const,
      tone: 'brown' as const,
      alert: false,
    },
    {
      label: 'Pending KYC',
      value: stats.pendingKyc,
      icon: ShieldCheck,
      tab: 'kyc' as const,
      tone: 'amber' as const,
      alert: stats.pendingKyc > 0,
      alertLabel: 'Review',
    },
    {
      label: 'Pending deposits',
      value: stats.pendingDeposits,
      icon: ArrowDownRight,
      tab: 'deposit_requests' as const,
      tone: 'emerald' as const,
      alert: stats.pendingDeposits > 0,
      alertLabel: 'Review',
    },
    {
      label: 'Pending withdrawals',
      value: stats.pendingWithdrawals,
      icon: ArrowUpRight,
      tab: 'withdrawals' as const,
      tone: 'rose' as const,
      alert: stats.pendingWithdrawals > 0,
      alertLabel: 'Approve',
    },
    {
      label: 'Wallet balance (all)',
      value: formatINR(stats.totalWalletBalance),
      icon: Wallet,
      tab: 'users' as const,
      tone: 'emerald' as const,
    },
    {
      label: 'Total invested',
      value: formatINR(stats.totalInvested),
      icon: TrendingUp,
      tab: 'investments' as const,
      tone: 'gold' as const,
    },
    {
      label: 'New lead inquiries',
      value: stats.newInquiries,
      icon: Mail,
      tab: 'inquiries' as const,
      tone: 'sky' as const,
      alert: stats.newInquiries > 0,
      alertLabel: 'New',
    },
    {
      label: 'Open support tickets',
      value: stats.openSupportTickets,
      icon: LifeBuoy,
      tab: 'support_tickets' as const,
      tone: 'violet' as const,
      alert: stats.openSupportTickets > 0,
      alertLabel: 'Reply',
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Overview"
        subtitle="Platform health and queues requiring action"
        icon={LayoutDashboard}
      />

      <OverviewDateRangeFilter value={overviewDateFilter} onChange={setOverviewDateFilter} />

      <div className="space-y-3">
        <div>
          <h3 className={adminTypography.sectionTitle}>Platform status</h3>
          <p className={adminTypography.meta}>Live queues and all-time totals (not filtered by date)</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => (
            <div key={c.label}>
              <AdminStatCard
                label={c.label}
                value={c.value}
                icon={c.icon}
                tone={c.tone}
                alert={c.alert}
                alertLabel={c.alertLabel}
                onClick={() => onNavigate(c.tab)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className={adminTypography.sectionTitle}>Key metrics</h3>
          <p className={adminTypography.meta}>
            Totals for <span className="font-semibold text-stone-700">{periodKpis.rangeLabel}</span>
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {periodCards.map((c) => (
            <div key={c.label}>
              <AdminStatCard
                label={c.label}
                value={c.value}
                icon={c.icon}
                tone={c.tone}
                onClick={() => onNavigate(c.tab)}
              />
            </div>
          ))}
        </div>
      </div>

      <OverviewCharts
        stats={stats}
        users={users}
        inquiries={inquiries}
        dateFilter={overviewDateFilter}
      />

      <div className="bg-gradient-to-r from-white via-[#faf7f2] to-white border border-[#e8dcc8] rounded-2xl p-5 shadow-sm">
        <h3 className={adminTypography.sectionTitle}>Investment tiers</h3>
        <p className={`${adminTypography.meta} mb-4`}>Member-facing plans on the website</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {plans.length === 0 ? (
            <p className="text-stone-500 col-span-full">No plans loaded — click Refresh or open Plans tab.</p>
          ) : (
            plans.map((p, i) => {
              const planTones = [
                'from-[#f8f1e8] to-white border-[#d8cec1] text-[#7f4e1c]',
                'from-amber-50 to-white border-amber-200 text-amber-900',
                'from-emerald-50 to-white border-emerald-200 text-emerald-900',
                'from-sky-50 to-white border-sky-200 text-sky-900',
              ];
              const tone = planTones[i % planTones.length];
              return (
                <div
                  key={p.id}
                  className={`rounded-xl px-3 py-3 border bg-gradient-to-br shadow-sm ${tone}`}
                >
                  <span className="font-bold block">{p.tier}</span>
                  <span className="opacity-80 block mt-1 font-mono text-sm">{formatINR(p.amount)}</span>
                  {p.featured && (
                    <span className="mt-2 inline-block text-xs font-bold uppercase bg-white/70 px-1.5 py-0.5 rounded">
                      Popular
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      <AdminTableCard
        title="Recent members"
        toolbar={
          <AdminTableToolbar
            searchInput={memberTable.searchInput}
            onSearchChange={memberTable.setSearchInput}
            searchPlaceholder="Search members…"
            filters={[
              { id: 'all', label: 'All' },
              { id: 'active', label: 'Active' },
              { id: 'kyc_pending', label: 'KYC pending' },
              { id: 'kyc_verified', label: 'KYC verified' },
            ]}
            filter={memberTable.filter}
            onFilterChange={memberTable.setFilter}
            total={memberTable.total}
            page={memberTable.page}
            totalPages={memberTable.totalPages}
            onPageChange={memberTable.setPage}
            {...adminTableControlProps(memberTable)}
          />
        }
      >
        <AdminTable>
          <AdminThead>
            <tr>
              <AdminTh>Member</AdminTh>
              <AdminTh>KYC</AdminTh>
              <AdminTh align="right">Balance</AdminTh>
            </tr>
          </AdminThead>
          <AdminTbody>
            {memberTable.paginated.length === 0 ? (
              <AdminEmptyRow colSpan={3} message="No members match your search." />
            ) : (
              memberTable.paginated.map((m) => (
                <AdminTr key={m.id}>
                  <AdminTd>
                    <AdminMemberCell
                      name={m.name}
                      sub={m.email}
                      userId={m.id}
                      onViewMember={onViewMember}
                    />
                  </AdminTd>
                  <AdminTd>
                    <AdminBadge tone={kycBadgeTone(m.kycStatus)}>
                      {(m.kycStatus || 'not_started').replace('_', ' ')}
                    </AdminBadge>
                  </AdminTd>
                  <AdminTd align="right">
                    <AdminMoney amount={formatINR(m.balance)} />
                  </AdminTd>
                </AdminTr>
              ))
            )}
          </AdminTbody>
        </AdminTable>
      </AdminTableCard>
    </div>
  );
}

function WithdrawalsTab({
  rows,
  onViewMember,
  onApprove,
  onReject,
}: {
  rows: ReturnType<typeof getPendingWithdrawals>;
  onViewMember: (userId: string) => void;
  onApprove: (userId: string, txId: string) => void;
  onReject: (userId: string, txId: string) => void;
}) {
  const [detailRow, setDetailRow] = useState<(typeof rows)[0] | null>(null);
  const table = useAdminTable({
    items: rows,
    searchFn: (r, q) =>
      r.userName.toLowerCase().includes(q) ||
      r.userEmail.toLowerCase().includes(q) ||
      r.userId.toLowerCase().includes(q) ||
      r.tx.id.toLowerCase().includes(q),
    filterFn: (r, f) => {
      if (f === 'high') return r.tx.amount >= 50000;
      if (f === 'low') return r.tx.amount < 50000;
      return true;
    },
    getItemDate: (r) => r.tx.date,
  });

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Withdrawal approvals" icon={ArrowUpRight} />
      <AdminTableToolbar
        searchInput={table.searchInput}
        onSearchChange={table.setSearchInput}
        searchPlaceholder="Search member, email, transaction id…"
        filters={[
          { id: 'all', label: 'All pending' },
          { id: 'high', label: '≥ ₹50,000' },
          { id: 'low', label: '< ₹50,000' },
        ]}
        filter={table.filter}
        onFilterChange={table.setFilter}
        total={table.total}
        page={table.page}
        totalPages={table.totalPages}
        onPageChange={table.setPage}
        {...adminTableControlProps(table)}
      />
      {rows.length === 0 ? (
        <p className="text-stone-500 text-sm">No pending withdrawal requests.</p>
      ) : table.paginated.length === 0 ? (
        <p className="text-stone-500 text-sm">No withdrawals match your filters.</p>
      ) : (
        <AdminTableCard>
          <AdminTable>
            <AdminThead>
              <tr>
                <AdminTh>Member</AdminTh>
                <AdminTh>Requested</AdminTh>
                <AdminTh align="right">Amount</AdminTh>
                <AdminTh align="right">Actions</AdminTh>
              </tr>
            </AdminThead>
            <AdminTbody>
              {table.paginated.map((r) => (
                <AdminTr key={r.tx.id}>
                  <AdminTd>
                    <AdminMemberCell
                      name={r.userName}
                      sub={r.userEmail}
                      userId={r.userId}
                      onViewMember={onViewMember}
                    />
                  </AdminTd>
                  <AdminTd className="text-stone-500 text-xs whitespace-nowrap">
                    {new Date(r.tx.date).toLocaleString()}
                  </AdminTd>
                  <AdminTd align="right">
                    <AdminMoney amount={formatINR(r.tx.amount)} />
                  </AdminTd>
                  <AdminTd align="right">
                    <AdminRowActions>
                      <AdminDetailsButton onClick={() => setDetailRow(r)} />
                      <AdminActionLink variant="approve" onClick={() => onApprove(r.userId, r.tx.id)}>
                        Approve
                      </AdminActionLink>
                      <AdminActionLink variant="reject" onClick={() => onReject(r.userId, r.tx.id)}>
                        Reject
                      </AdminActionLink>
                    </AdminRowActions>
                  </AdminTd>
                </AdminTr>
              ))}
            </AdminTbody>
          </AdminTable>
        </AdminTableCard>
      )}
      {detailRow && (
        <AdminWithdrawalDetailModal
          row={detailRow}
          onClose={() => setDetailRow(null)}
          onViewMember={onViewMember}
        />
      )}
    </div>
  );
}

function TransactionsTab({
  rows,
  onViewMember,
}: {
  rows: ReturnType<typeof flattenTransactions>;
  onViewMember: (userId: string) => void;
}) {
  const [detailRow, setDetailRow] = useState<(typeof rows)[0] | null>(null);
  const table = useAdminTable({
    items: rows,
    searchFn: (r, q) =>
      r.userName.toLowerCase().includes(q) ||
      r.userEmail.toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q),
    filterFn: (r, f) => {
      if (f === 'deposit' || f === 'withdrawal') return r.type === f;
      if (f === 'completed' || f === 'pending' || f === 'rejected') return r.status === f;
      return true;
    },
    getItemDate: (r) => r.date,
  });

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Transaction history"
        subtitle="Deposits and withdrawals only — use Deposit requests and Withdrawal approvals for pending review"
        icon={Receipt}
      />
      <AdminTableToolbar
        searchInput={table.searchInput}
        onSearchChange={table.setSearchInput}
        searchPlaceholder="Search member, type, status…"
        filters={[
          { id: 'all', label: 'All' },
          { id: 'deposit', label: 'Deposits' },
          { id: 'withdrawal', label: 'Withdrawals' },
          { id: 'pending', label: 'Pending' },
          { id: 'completed', label: 'Completed' },
          { id: 'rejected', label: 'Rejected' },
        ]}
        filter={table.filter}
        onFilterChange={table.setFilter}
        total={table.total}
        page={table.page}
        totalPages={table.totalPages}
        onPageChange={table.setPage}
        {...adminTableControlProps(table)}
      />
      <AdminTableCard>
        <AdminTable minWidth="min-w-[720px]">
          <AdminThead>
            <tr>
              <AdminTh>Member</AdminTh>
              <AdminTh>Type</AdminTh>
              <AdminTh>Status</AdminTh>
              <AdminTh align="right">Amount</AdminTh>
              <AdminTh>Date</AdminTh>
              <AdminTh align="right">Actions</AdminTh>
            </tr>
          </AdminThead>
          <AdminTbody>
            {table.paginated.length === 0 ? (
              <AdminEmptyRow colSpan={6} message="No transactions match your filters." />
            ) : (
              table.paginated.map((r) => (
                <AdminTr key={`${r.userId}-${r.id}`}>
                  <AdminTd>
                    <AdminMemberCell
                      name={r.userName}
                      sub={r.userEmail}
                      userId={r.userId}
                      onViewMember={onViewMember}
                    />
                  </AdminTd>
                  <AdminTd>
                    <AdminBadge tone="info">{r.type}</AdminBadge>
                  </AdminTd>
                  <AdminTd>
                    <AdminBadge
                      tone={
                        r.status === 'completed'
                          ? 'success'
                          : r.status === 'pending'
                            ? 'warning'
                            : r.status === 'rejected'
                              ? 'danger'
                              : 'neutral'
                      }
                    >
                      {r.status}
                    </AdminBadge>
                  </AdminTd>
                  <AdminTd align="right" mono accent>
                    <AdminMoney amount={formatINR(r.amount)} />
                  </AdminTd>
                  <AdminTd className="text-xs text-stone-500 whitespace-nowrap">
                    {new Date(r.date).toLocaleString()}
                  </AdminTd>
                  <AdminTd align="right">
                    <AdminDetailsButton onClick={() => setDetailRow(r)} />
                  </AdminTd>
                </AdminTr>
              ))
            )}
          </AdminTbody>
        </AdminTable>
      </AdminTableCard>
      {detailRow && (
        <AdminTransactionDetailModal
          row={detailRow}
          onClose={() => setDetailRow(null)}
          onViewMember={onViewMember}
        />
      )}
    </div>
  );
}

function InvestmentsTab({
  rows,
  members,
  plans,
  onRefresh,
  onViewMember,
}: {
  rows: ReturnType<typeof flattenInvestments>;
  members: User[];
  plans: InvestmentPlan[];
  onRefresh: () => void;
  onViewMember: (userId: string) => void;
}) {
  const [view, setView] = useState<'list' | 'by-plan'>('list');
  const [assignUserId, setAssignUserId] = useState('');
  const [assignPlanId, setAssignPlanId] = useState('');
  const [detailRow, setDetailRow] = useState<(typeof rows)[0] | null>(null);
  const auth = useAuth();

  const planOptions = useMemo(() => {
    const names = new Set(rows.map((r) => r.planName));
    return Array.from(names).sort();
  }, [rows]);

  const table = useAdminTable({
    items: rows,
    searchFn: (r, q) =>
      r.userName.toLowerCase().includes(q) ||
      r.userEmail.toLowerCase().includes(q) ||
      r.planName.toLowerCase().includes(q) ||
      (r.planId || '').toLowerCase().includes(q),
    filterFn: (r, f) => {
      if (f === 'all') return true;
      return r.planName === f || r.planId === f;
    },
    getItemDate: (r) => r.date,
  });

  const filtered = table.filtered;

  const paginatedRowKeys = useMemo(
    () => new Set(table.paginated.map((r) => `${r.userId}-${r.id}`)),
    [table.paginated]
  );

  const byPlan = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const r of filtered) {
      const key = r.planName || 'Unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const handleAssign = async () => {
    if (!assignUserId || !assignPlanId) {
      toast.error('Select a member and plan');
      return;
    }
    const result = await auth.adminAssignInvestment(assignUserId, assignPlanId);
    if (!result.ok) toast.error(result.message);
    else {
      await onRefresh();
      toast.success('Investment recorded for member');
      setAssignUserId('');
      setAssignPlanId('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <AdminPageHeader
            title="Plan purchases"
            subtitle="See which member bought which investment tier."
            icon={TrendingUp}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setView('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${view === 'list' ? 'bg-[#7f4e1c] text-white' : 'bg-stone-100 text-stone-600'}`}
          >
            All purchases
          </button>
          <button
            type="button"
            onClick={() => setView('by-plan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${view === 'by-plan' ? 'bg-[#7f4e1c] text-white' : 'bg-stone-100 text-stone-600'}`}
          >
            Group by plan
          </button>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-wrap gap-3 items-end">
        <p className="text-xs text-stone-500 w-full uppercase font-semibold">Record purchase (admin)</p>
        <select
          value={assignUserId}
          onChange={(e) => setAssignUserId(e.target.value)}
          className="bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-900 min-w-[180px]"
        >
          <option value="">Select member…</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({formatINR(m.balance)})
            </option>
          ))}
        </select>
        <select
          value={assignPlanId}
          onChange={(e) => setAssignPlanId(e.target.value)}
          className="bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-900 min-w-[180px]"
        >
          <option value="">Select plan…</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.tier} — {formatINR(p.amount)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAssign}
          className="px-4 py-2 rounded-lg bg-[#7f4e1c] hover:bg-[#633a11] text-white text-sm font-semibold shadow-sm"
        >
          Assign plan
        </button>
      </div>

      {view === 'list' && (
        <>
          <AdminTableToolbar
            searchInput={table.searchInput}
            onSearchChange={table.setSearchInput}
            searchPlaceholder="Search member, email, plan…"
            filters={[
              { id: 'all', label: `All (${rows.length})` },
              ...planOptions.map((name) => ({
                id: name,
                label: `${name} (${rows.filter((r) => r.planName === name).length})`,
              })),
            ]}
            filter={table.filter}
            onFilterChange={table.setFilter}
            total={filtered.length}
            page={table.page}
            totalPages={table.totalPages}
            onPageChange={table.setPage}
            pageSize={table.pageSize}
            {...adminTableControlProps(table)}
          />
          {filtered.length === 0 ? (
            <p className="text-stone-500 text-sm py-8 text-center bg-white border border-stone-200 rounded-2xl">
              No investments match your filters.
            </p>
          ) : (
            <AdminTableCard>
              <AdminTable minWidth="min-w-[720px]">
                <AdminThead>
                  <tr>
                    <AdminTh>Member</AdminTh>
                    <AdminTh>Plan</AdminTh>
                    <AdminTh align="right">Amount</AdminTh>
                    <AdminTh>Date</AdminTh>
                    <AdminTh align="right">Actions</AdminTh>
                  </tr>
                </AdminThead>
                <AdminTbody>
                  {table.paginated.map((r) => (
                    <AdminTr key={`${r.userId}-${r.id}`}>
                      <AdminTd>
                        <AdminMemberCell
                          name={r.userName}
                          sub={r.userEmail}
                          userId={r.userId}
                          onViewMember={onViewMember}
                        />
                      </AdminTd>
                      <AdminTd>
                        <span className="font-semibold text-stone-800">{r.planName}</span>
                        {r.planId && (
                          <span className="block text-xs text-stone-400 font-mono mt-0.5">{r.planId}</span>
                        )}
                      </AdminTd>
                      <AdminTd align="right">
                        <AdminMoney amount={formatINR(r.amount)} />
                      </AdminTd>
                      <AdminTd className="text-xs text-stone-500">
                        {new Date(r.date).toLocaleDateString()}
                      </AdminTd>
                      <AdminTd align="right">
                        <AdminDetailsButton onClick={() => setDetailRow(r)} />
                      </AdminTd>
                    </AdminTr>
                  ))}
                </AdminTbody>
              </AdminTable>
            </AdminTableCard>
          )}
        </>
      )}

      {detailRow && (
        <AdminInvestmentDetailModal
          row={detailRow}
          onClose={() => setDetailRow(null)}
          onViewMember={onViewMember}
        />
      )}

      {view === 'by-plan' && (
        <div className="space-y-4">
          <AdminTableToolbar
            searchInput={table.searchInput}
            onSearchChange={table.setSearchInput}
            searchPlaceholder="Search member, email, plan…"
            filters={[
              { id: 'all', label: 'All plans' },
              ...planOptions.map((name) => ({ id: name, label: name })),
            ]}
            filter={table.filter}
            onFilterChange={table.setFilter}
            total={filtered.length}
            page={table.page}
            totalPages={table.totalPages}
            onPageChange={table.setPage}
            pageSize={table.pageSize}
            {...adminTableControlProps(table)}
          />
          {byPlan.length === 0 ? (
            <p className="text-stone-500 text-sm">No purchases yet.</p>
          ) : (
            byPlan.map(([planName, planRows]) => {
              const rowsOnPage = planRows.filter((r) =>
                paginatedRowKeys.has(`${r.userId}-${r.id}`)
              );
              if (rowsOnPage.length === 0) return null;
              return (
              <div key={planName}>
              <AdminTableCard
                title={planName}
                subtitle={`${rowsOnPage.length} on this page · ${planRows.length} total`}
              >
                <AdminTable>
                  <AdminThead>
                    <tr>
                      <AdminTh>Member</AdminTh>
                      <AdminTh align="right">Amount</AdminTh>
                      <AdminTh>Date</AdminTh>
                      <AdminTh align="right">Actions</AdminTh>
                    </tr>
                  </AdminThead>
                  <AdminTbody>
                    {rowsOnPage.map((r) => (
                      <AdminTr key={`${r.userId}-${r.id}`}>
                        <AdminTd>
                          <AdminMemberCell
                            name={r.userName}
                            sub={r.userEmail}
                            userId={r.userId}
                            onViewMember={onViewMember}
                          />
                        </AdminTd>
                        <AdminTd align="right">
                          <AdminMoney amount={formatINR(r.amount)} />
                        </AdminTd>
                        <AdminTd className="text-xs text-stone-500">
                          {new Date(r.date).toLocaleDateString()}
                        </AdminTd>
                        <AdminTd align="right">
                          <AdminDetailsButton onClick={() => setDetailRow(r)} />
                        </AdminTd>
                      </AdminTr>
                    ))}
                  </AdminTbody>
                </AdminTable>
              </AdminTableCard>
              </div>
            );
            })
          )}
        </div>
      )}
    </div>
  );
}

function InquiriesTab({
  inquiries,
  onStatusChange,
}: {
  inquiries: ContactInquiry[];
  onStatusChange: (id: string, status: ContactInquiry['status']) => void;
}) {
  const table = useAdminTable({
    items: inquiries,
    searchFn: (q, s) =>
      q.fullname.toLowerCase().includes(s) ||
      q.email.toLowerCase().includes(s) ||
      q.phone.includes(s) ||
      q.planLabel.toLowerCase().includes(s) ||
      (q.message || '').toLowerCase().includes(s),
    filterFn: (q, f) => q.status === f,
    getItemDate: (q) => q.createdAt,
  });

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Lead inquiries"
        subtitle='Submissions from the public "Join Gaulaxmi" contact form.'
        icon={Mail}
      />
      <AdminTableToolbar
        searchInput={table.searchInput}
        onSearchChange={table.setSearchInput}
        searchPlaceholder="Search name, phone, email, plan…"
        filters={[
          { id: 'all', label: 'All' },
          { id: 'new', label: 'New' },
          { id: 'contacted', label: 'Contacted' },
          { id: 'closed', label: 'Closed' },
        ]}
        filter={table.filter}
        onFilterChange={table.setFilter}
        total={table.total}
        page={table.page}
        totalPages={table.totalPages}
        onPageChange={table.setPage}
        {...adminTableControlProps(table)}
      />
      {inquiries.length === 0 ? (
        <p className="text-stone-500 text-sm">No inquiries yet.</p>
      ) : table.paginated.length === 0 ? (
        <p className="text-stone-500 text-sm">No inquiries match your filters.</p>
      ) : (
        <div className="space-y-3">
          {table.paginated.map((q) => (
            <div key={q.id} className="bg-white border border-stone-200 rounded-xl p-5">
              <div className="flex flex-wrap justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-semibold text-stone-900">{q.fullname}</h3>
                  <p className="text-xs text-stone-500">
                    {q.phone} · {q.email || 'No email'}
                  </p>
                </div>
                <span
                  className={`text-xs uppercase font-bold px-2 py-1 rounded-full ${
                    q.status === 'new'
                      ? 'bg-[#f8f1e8] text-[#9a5f23]'
                      : q.status === 'contacted'
                      ? 'bg-sky-500/20 text-sky-400'
                      : 'bg-stone-200 text-stone-500'
                  }`}
                >
                  {q.status}
                </span>
              </div>
              <p className="text-sm text-[#9a5f23]/90">{q.planLabel}</p>
              {q.message && <p className="text-sm text-stone-600 mt-2">{q.message}</p>}
              <p className="text-xs text-stone-500 mt-2">{new Date(q.createdAt).toLocaleString()}</p>
              <div className="flex gap-2 mt-3">
                {(['new', 'contacted', 'closed'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onStatusChange(q.id, s)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      q.status === s ? 'bg-[#7f4e1c] text-white' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
