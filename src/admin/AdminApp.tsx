import React, { useEffect, useMemo, useState } from 'react';
import { useAuth, type User } from '../lib/auth';
import {
  ADMIN_NAV_ITEMS,
  type AdminTabId,
  isAdminUser,
  exportAccountsJson,
  importAccountsJson,
} from '../lib/admin';
import { buildMemberEntryUrl } from '../lib/appBridge';
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
import type { InvestmentPlan, MilestoneTier } from '../../shared/types';
import { PlansAdminTab } from './tabs/PlansAdminTab';
import { MilestonesAdminTab } from './tabs/MilestonesAdminTab';
import { KycAdminTab } from './tabs/KycAdminTab';
import { AdminTableToolbar } from './components/AdminTableToolbar';
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
import { adminNavActive, adminNavIdle, adminShell, adminTypography } from './adminTheme';
import { ApiStatusBar } from './components/ApiStatusBar';
import { toast } from 'react-hot-toast';
import logo from '../assets/Images/gaulaxmi-logo.png';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  ArrowUpRight,
  Receipt,
  TrendingUp,
  Mail,
  LogOut,
  ExternalLink,
  RefreshCw,
  Download,
  Upload,
  UserX,
  UserCheck,
  Wallet,
} from 'lucide-react';

const ADMIN_SESSION_KEY = 'gaulaxmi_admin_session';

export function AdminApp() {
  const auth = useAuth();
  const [tab, setTab] = useState<AdminTabId>('overview');
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [catalogPlans, setCatalogPlans] = useState<InvestmentPlan[]>([]);
  const [catalogMilestones, setCatalogMilestones] = useState<MilestoneTier[]>([]);
  const [apiConnected, setApiConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [balanceAdjust, setBalanceAdjust] = useState({ amount: '', note: '' });
  const [adminUnlocked, setAdminUnlocked] = useState(
    () => localStorage.getItem(ADMIN_SESSION_KEY) === '1'
  );

  const isAdminSession = auth.isLoggedIn && isAdminUser(auth.user) && adminUnlocked;

  const members = useMemo(() => getMemberAccounts(auth.allUsers), [auth.allUsers]);
  const [serverStats, setServerStats] = useState<ReturnType<typeof computeOverviewStats> | null>(null);

  const stats = useMemo(
    () => serverStats ?? computeOverviewStats(auth.allUsers, inquiries),
    [serverStats, auth.allUsers, inquiries]
  );

  const refreshAll = async () => {
    setSyncing(true);
    try {
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
        totalWalletBalance: apiStats.totalWalletBalance,
        totalInvested: apiStats.totalInvested,
        newInquiries: apiStats.newInquiries,
        totalInquiries: apiStats.totalInquiries,
      });
      setApiConnected(true);
    } catch {
      setApiConnected(false);
      toast.error('Could not reach API. Run npm run dev:api (port 4000).');
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

  const selectedUser = members.find((u) => u.id === selectedUserId) ?? null;

  const handleAdminLogin = async (email: string, password: string) => {
    const result = await auth.login(email, password);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    if (!isAdminUser(result.user)) {
      auth.logout();
      toast.error('This account does not have admin access.');
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
      <aside className={adminShell.sidebar}>
        <div className="mb-6 pb-5 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Gaulaxmi" className="h-11 w-11 object-contain shrink-0" />
            <div className="min-w-0">
              <p className={adminTypography.brandTitle}>Gaulaxmi</p>
              <p className={`${adminTypography.brandEyebrow} mt-0.5`}>Admin Console</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-none">
          {ADMIN_NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={tab === item.id ? adminNavActive : adminNavIdle}
            >
              {item.label}
              {item.id === 'kyc' && stats.pendingKyc > 0 && (
                <span className={`ml-2 ${adminTypography.navBadge} bg-red-500 text-white`}>
                  {stats.pendingKyc}
                </span>
              )}
              {item.id === 'withdrawals' && stats.pendingWithdrawals > 0 && (
                <span className={`ml-2 ${adminTypography.navBadge} bg-amber-100 text-amber-800`}>
                  {stats.pendingWithdrawals}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="pt-4 border-t border-stone-100 space-y-2">
          <a
            href={buildMemberEntryUrl()}
            className="flex items-center gap-2 text-xs text-stone-500 hover:text-[#7f4e1c] px-2 py-2 rounded-lg hover:bg-[#f8f1e8] transition"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Member site
          </a>
          <button
            type="button"
            onClick={handleAdminLogout}
            className="w-full flex items-center gap-2 text-sm text-stone-500 hover:text-red-600 hover:bg-red-50 px-3 py-2.5 rounded-xl transition"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className={adminShell.header}>
          <div className="flex items-center gap-2 lg:hidden min-w-0">
            <img src={logo} alt="Gaulaxmi" className="h-8 w-8 object-contain shrink-0" />
            <span className="font-display text-sm font-bold text-primary truncate">Admin</span>
          </div>
          <div className="lg:hidden flex gap-1 overflow-x-auto scrollbar-none flex-1">
            {ADMIN_NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`shrink-0 px-3 py-2 rounded-lg text-sm font-semibold ${
                  tab === item.id ? 'bg-[#7f4e1c] text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="hidden lg:flex items-center gap-2 min-w-0">
            <img src={logo} alt="Gaulaxmi" className="h-7 w-7 object-contain shrink-0 lg:hidden" />
            <p className="text-sm text-stone-500">
              Signed in as <span className="text-stone-900 font-medium">{auth.user?.email}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void refreshAll()}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-sm font-semibold disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </header>

        <main className={adminShell.main}>
          <ApiStatusBar
            connected={apiConnected}
            loading={syncing}
            planCount={catalogPlans.length}
            milestoneCount={catalogMilestones.length}
            memberCount={members.length}
          />
          <DataSyncBanner users={auth.allUsers} onImported={() => void refreshAll()} />

          {tab === 'overview' && (
            <OverviewTab stats={stats} members={members} plans={catalogPlans} onNavigate={setTab} />
          )}

          {tab === 'users' && (
            <UsersTab
              members={members}
              selectedUser={selectedUser}
              onSelectUser={setSelectedUserId}
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
                setSelectedUserId(null);
                await refreshAll();
                toast.success('User removed');
              }}
            />
          )}

          {tab === 'kyc' && (
            <KycAdminTab
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

          {tab === 'withdrawals' && (
            <WithdrawalsTab
              rows={getPendingWithdrawals(auth.allUsers)}
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
            <TransactionsTab rows={flattenTransactions(auth.allUsers)} />
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
            />
          )}

          {tab === 'milestones' && (
            <MilestonesAdminTab
              users={auth.allUsers}
              milestones={catalogMilestones}
              onSetFulfillment={auth.adminSetMilestoneFulfillment}
              onRefresh={refreshAll}
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
        </main>
      </div>
    </div>
  );
}

function AdminLoginForm({ onLogin }: { onLogin: (email: string, pass: string) => void }) {
  const [email, setEmail] = useState('admin@gaulaxmi.io');
  const [password, setPassword] = useState('');

  return (
    <div className={`${adminShell.root} items-center justify-center p-4 bg-gradient-warm`}>
      <div className="w-full max-w-md bg-white border border-stone-200 rounded-3xl p-8 shadow-soft">
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
  plans,
  onNavigate,
}: {
  stats: ReturnType<typeof computeOverviewStats>;
  members: User[];
  plans: InvestmentPlan[];
  onNavigate: (t: AdminTabId) => void;
}) {
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
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Overview"
        subtitle="Platform health and queues requiring action"
        icon={LayoutDashboard}
      />
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
                    <AdminMemberCell name={m.name} sub={m.email} />
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

type MemberConfirmAction =
  | { type: 'deactivate'; user: User }
  | { type: 'reactivate'; user: User }
  | { type: 'remove'; user: User };

function UsersTab({
  members,
  selectedUser,
  onSelectUser,
  balanceAdjust,
  onBalanceAdjustChange,
  onAdjustBalance,
  onDeactivate,
  onRemove,
}: {
  members: User[];
  selectedUser: User | null;
  onSelectUser: (id: string | null) => void;
  balanceAdjust: { amount: string; note: string };
  onBalanceAdjustChange: (v: { amount: string; note: string }) => void;
  onAdjustBalance: (userId: string, amount: number, note: string) => void;
  onDeactivate: (userId: string, deactivated: boolean) => void | Promise<void>;
  onRemove: (userId: string) => void | Promise<void>;
}) {
  const [confirmAction, setConfirmAction] = useState<MemberConfirmAction | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setConfirmLoading(true);
    try {
      if (confirmAction.type === 'deactivate') {
        await onDeactivate(confirmAction.user.id, true);
      } else if (confirmAction.type === 'reactivate') {
        await onDeactivate(confirmAction.user.id, false);
      } else {
        await onRemove(confirmAction.user.id);
        if (selectedUser?.id === confirmAction.user.id) onSelectUser(null);
      }
      setConfirmAction(null);
    } finally {
      setConfirmLoading(false);
    }
  };

  const table = useAdminTable({
    items: members,
    searchFn: (m, q) =>
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q) ||
      (m.phone || '').includes(q),
    filterFn: (m, f) => {
      if (f === 'active') return !m.isDeactivated;
      if (f === 'deactivated') return !!m.isDeactivated;
      if (f === 'kyc_submitted') return m.kycStatus === 'submitted';
      if (f === 'kyc_verified') return m.kycStatus === 'verified' || !!m.isKycVerified;
      if (f === 'kyc_rejected') return m.kycStatus === 'rejected';
      if (f === 'kyc_none') return !m.kycStatus || m.kycStatus === 'not_started';
      return true;
    },
  });

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Users" icon={Users} />
      <AdminTableToolbar
        searchInput={table.searchInput}
        onSearchChange={table.setSearchInput}
        searchPlaceholder="Search name, email, id, phone…"
        filters={[
          { id: 'all', label: 'All' },
          { id: 'active', label: 'Active' },
          { id: 'deactivated', label: 'Deactivated' },
          { id: 'kyc_submitted', label: 'KYC pending' },
          { id: 'kyc_verified', label: 'KYC verified' },
          { id: 'kyc_rejected', label: 'KYC rejected' },
        ]}
        filter={table.filter}
        onFilterChange={table.setFilter}
        total={table.total}
        page={table.page}
        totalPages={table.totalPages}
        onPageChange={table.setPage}
      />
      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <AdminTableCard>
            <AdminTable>
              <AdminThead>
                <tr>
                  <AdminTh>Member</AdminTh>
                  <AdminTh>KYC</AdminTh>
                  <AdminTh align="right">Balance</AdminTh>
                </tr>
              </AdminThead>
              <AdminTbody>
                {table.paginated.length === 0 ? (
                  <AdminEmptyRow colSpan={3} />
                ) : (
                  table.paginated.map((m) => (
                    <AdminTr
                      key={m.id}
                      onClick={() => onSelectUser(m.id)}
                      selected={selectedUser?.id === m.id}
                    >
                      <AdminTd>
                        <AdminMemberCell name={m.name} sub={m.email} />
                      </AdminTd>
                      <AdminTd>
                        <AdminBadge tone={kycBadgeTone(m.kycStatus)}>
                          {(m.kycStatus || 'none').replace('_', ' ')}
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
        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-xl p-5 min-h-[200px]">
          {selectedUser ? (
            <div className="space-y-4 text-sm">
              <div>
                <h3 className={adminTypography.sectionTitle}>{selectedUser.name}</h3>
                <p className="text-stone-500">{selectedUser.email}</p>
                <p className="text-xs text-stone-500 mt-1 font-mono">{selectedUser.id}</p>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <dt className="text-stone-500">Balance</dt>
                <dd className="font-mono text-stone-900">{formatINR(selectedUser.balance)}</dd>
                <dt className="text-stone-500">Investments</dt>
                <dd>{selectedUser.investments?.length || 0}</dd>
                <dt className="text-stone-500">Referrals</dt>
                <dd>{selectedUser.referrals?.length || 0}</dd>
                <dt className="text-stone-500">Status</dt>
                <dd>{selectedUser.isDeactivated ? 'Deactivated' : 'Active'}</dd>
              </dl>
              <div className="border-t border-stone-200 pt-4 space-y-2">
                <p className="text-xs font-semibold text-stone-500 uppercase">Adjust balance</p>
                <input
                  type="number"
                  placeholder="Amount (+ credit, − debit)"
                  value={balanceAdjust.amount}
                  onChange={(e) => onBalanceAdjustChange({ ...balanceAdjust, amount: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-900 text-sm"
                />
                <input
                  placeholder="Note"
                  value={balanceAdjust.note}
                  onChange={(e) => onBalanceAdjustChange({ ...balanceAdjust, note: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-900 text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    const amt = Number(balanceAdjust.amount);
                    if (!amt) return toast.error('Enter an amount');
                    onAdjustBalance(selectedUser.id, amt, balanceAdjust.note || 'Admin adjustment');
                    onBalanceAdjustChange({ amount: '', note: '' });
                  }}
                  className="w-full py-2 rounded-lg bg-[#7f4e1c] hover:bg-[#633a11] text-white font-semibold text-xs"
                >
                  Apply adjustment
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setConfirmAction(
                      selectedUser.isDeactivated
                        ? { type: 'reactivate', user: selectedUser }
                        : { type: 'deactivate', user: selectedUser }
                    )
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition ${
                    selectedUser.isDeactivated
                      ? 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100'
                      : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  {selectedUser.isDeactivated ? (
                    <>
                      <UserCheck className="w-4 h-4" /> Reactivate
                    </>
                  ) : (
                    <>
                      <UserX className="w-4 h-4" /> Deactivate
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmAction({ type: 'remove', user: selectedUser })}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-sm font-semibold transition"
                >
                  Remove user
                </button>
              </div>
            </div>
          ) : (
            <p className="text-stone-500 text-sm">Select a member to view details and actions.</p>
          )}
        </div>
      </div>

      <AdminConfirmDialog
        open={confirmAction?.type === 'deactivate'}
        title="Deactivate member?"
        description={`This will lock ${confirmAction?.user.name ?? 'this member'} out of investing and withdrawals until reactivated.`}
        details={
          <>
            <p>
              <strong className="text-stone-800">{confirmAction?.user.email}</strong>
            </p>
            <p className="mt-2">Their wallet balance, investments, and KYC records stay in the system.</p>
          </>
        }
        confirmLabel="Yes, deactivate"
        variant="warning"
        loading={confirmLoading}
        onConfirm={() => void handleConfirmAction()}
        onCancel={() => !confirmLoading && setConfirmAction(null)}
      />

      <AdminConfirmDialog
        open={confirmAction?.type === 'reactivate'}
        title="Reactivate member?"
        description={`Restore full access for ${confirmAction?.user.name ?? 'this member'}.`}
        details={
          <>
            <p>
              <strong className="text-stone-800">{confirmAction?.user.email}</strong>
            </p>
            <p className="mt-2">They can sign in, invest, and request withdrawals again.</p>
          </>
        }
        confirmLabel="Yes, reactivate"
        variant="success"
        loading={confirmLoading}
        onConfirm={() => void handleConfirmAction()}
        onCancel={() => !confirmLoading && setConfirmAction(null)}
      />

      <AdminConfirmDialog
        open={confirmAction?.type === 'remove'}
        title="Remove member permanently?"
        description="This cannot be undone. All account data for this member will be deleted from the server."
        details={
          confirmAction?.type === 'remove' ? (
            <>
              <p>
                <strong className="text-stone-800">{confirmAction.user.name}</strong>
                <br />
                <span className="text-stone-500">{confirmAction.user.email}</span>
              </p>
              <p className="mt-2 font-mono text-xs text-stone-500">ID: {confirmAction.user.id}</p>
            </>
          ) : null
        }
        confirmLabel="Yes, remove permanently"
        variant="danger"
        loading={confirmLoading}
        onConfirm={() => void handleConfirmAction()}
        onCancel={() => !confirmLoading && setConfirmAction(null)}
      />
    </div>
  );
}

function WithdrawalsTab({
  rows,
  onApprove,
  onReject,
}: {
  rows: ReturnType<typeof getPendingWithdrawals>;
  onApprove: (userId: string, txId: string) => void;
  onReject: (userId: string, txId: string) => void;
}) {
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
                    <AdminMemberCell name={r.userName} sub={r.userEmail} />
                  </AdminTd>
                  <AdminTd className="text-stone-500 text-xs whitespace-nowrap">
                    {new Date(r.tx.date).toLocaleString()}
                  </AdminTd>
                  <AdminTd align="right">
                    <AdminMoney amount={formatINR(r.tx.amount)} />
                  </AdminTd>
                  <AdminTd align="right">
                    <AdminRowActions>
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
    </div>
  );
}

function TransactionsTab({
  rows,
}: {
  rows: ReturnType<typeof flattenTransactions>;
}) {
  const table = useAdminTable({
    items: rows,
    searchFn: (r, q) =>
      r.userName.toLowerCase().includes(q) ||
      r.userEmail.toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q),
    filterFn: (r, f) => {
      if (f === 'deposit' || f === 'withdrawal' || f === 'investment') return r.type === f;
      if (f === 'completed' || f === 'pending' || f === 'rejected') return r.status === f;
      return true;
    },
  });

  return (
    <div className="space-y-4">
      <AdminPageHeader title="All transactions" icon={Receipt} />
      <AdminTableToolbar
        searchInput={table.searchInput}
        onSearchChange={table.setSearchInput}
        searchPlaceholder="Search member, type, status…"
        filters={[
          { id: 'all', label: 'All' },
          { id: 'deposit', label: 'Deposits' },
          { id: 'withdrawal', label: 'Withdrawals' },
          { id: 'investment', label: 'Investments' },
          { id: 'pending', label: 'Pending' },
          { id: 'completed', label: 'Completed' },
        ]}
        filter={table.filter}
        onFilterChange={table.setFilter}
        total={table.total}
        page={table.page}
        totalPages={table.totalPages}
        onPageChange={table.setPage}
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
            </tr>
          </AdminThead>
          <AdminTbody>
            {table.paginated.length === 0 ? (
              <AdminEmptyRow colSpan={5} message="No transactions match your filters." />
            ) : (
              table.paginated.map((r) => (
                <AdminTr key={`${r.userId}-${r.id}`}>
                  <AdminTd>
                    <AdminMemberCell name={r.userName} sub={r.userEmail} />
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
                </AdminTr>
              ))
            )}
          </AdminTbody>
        </AdminTable>
      </AdminTableCard>
    </div>
  );
}

function InvestmentsTab({
  rows,
  members,
  plans,
  onRefresh,
}: {
  rows: ReturnType<typeof flattenInvestments>;
  members: User[];
  plans: InvestmentPlan[];
  onRefresh: () => void;
}) {
  const [view, setView] = useState<'list' | 'by-plan'>('list');
  const [assignUserId, setAssignUserId] = useState('');
  const [assignPlanId, setAssignPlanId] = useState('');
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
  });

  const filtered = table.filtered;

  const listPageSize = table.pageSize;
  const listTotalPages = Math.max(1, Math.ceil(filtered.length / listPageSize));
  const listPage = Math.min(table.page, listTotalPages);
  const listPaginated = filtered.slice((listPage - 1) * listPageSize, listPage * listPageSize);

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
            page={listPage}
            totalPages={listTotalPages}
            onPageChange={table.setPage}
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
                  </tr>
                </AdminThead>
                <AdminTbody>
                  {listPaginated.map((r) => (
                    <AdminTr key={`${r.userId}-${r.id}`}>
                      <AdminTd>
                        <AdminMemberCell name={r.userName} sub={r.userEmail} />
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
                    </AdminTr>
                  ))}
                </AdminTbody>
              </AdminTable>
            </AdminTableCard>
          )}
        </>
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
            page={listPage}
            totalPages={listTotalPages}
            onPageChange={table.setPage}
          />
          {byPlan.length === 0 ? (
            <p className="text-stone-500 text-sm">No purchases yet.</p>
          ) : (
            byPlan.map(([planName, planRows]) => (
              <div key={planName}>
              <AdminTableCard
                title={planName}
                subtitle={`${planRows.length} purchase${planRows.length === 1 ? '' : 's'}`}
              >
                <AdminTable>
                  <AdminThead>
                    <tr>
                      <AdminTh>Member</AdminTh>
                      <AdminTh align="right">Amount</AdminTh>
                      <AdminTh>Date</AdminTh>
                    </tr>
                  </AdminThead>
                  <AdminTbody>
                    {planRows.map((r) => (
                      <AdminTr key={`${r.userId}-${r.id}`}>
                        <AdminTd>
                          <AdminMemberCell name={r.userName} sub={r.userEmail} />
                        </AdminTd>
                        <AdminTd align="right">
                          <AdminMoney amount={formatINR(r.amount)} />
                        </AdminTd>
                        <AdminTd className="text-xs text-stone-500">
                          {new Date(r.date).toLocaleDateString()}
                        </AdminTd>
                      </AdminTr>
                    ))}
                  </AdminTbody>
                </AdminTable>
              </AdminTableCard>
              </div>
            ))
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
