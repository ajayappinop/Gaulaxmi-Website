import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  UserRound,
  UserCheck,
  UserX,
  Wallet,
  TrendingUp,
  Users,
  Receipt,
  ShieldCheck,
  LayoutGrid,
  Settings,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Referral, Transaction, User } from '../../lib/auth';
import { formatINR } from '../../lib/plans';
import { buildPortfolioProgress } from '../../lib/investmentProgress';
import { PLAN_MONTHLY_RATE, PLAN_TENURE_MONTHS } from '../../lib/planStore';
import type { FlatTransaction } from '../../lib/adminStats';
import { api } from '../../lib/apiClient';
import { buildMemberDashboardHandoffUrl } from '../../lib/appBridge';
import { adminCard, adminTypography, adminBtnPrimary } from '../adminTheme';
import { AdminBadge, kycBadgeTone } from '../components/AdminDataTable';
import { AdminConfirmDialog } from '../components/AdminConfirmDialog';
import { AdminTransactionDetailModal } from '../components/AdminTransactionDetailModal';
import { AdminDetailsButton } from '../components/AdminDetailsButton';
import { TablePagination } from '../../components/TablePagination';
import { TableDateSortControls } from '../../components/TableDateSortControls';
import { useTableList } from '../../hooks/useTableList';

type MemberDetailTabId =
  | 'overview'
  | 'profile'
  | 'investments'
  | 'transactions'
  | 'referrals'
  | 'admin';

type MemberConfirmAction =
  | { type: 'deactivate'; user: User }
  | { type: 'reactivate'; user: User }
  | { type: 'remove'; user: User };

const MEMBER_DETAIL_TABS: {
  id: MemberDetailTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'profile', label: 'Profile & KYC', icon: ShieldCheck },
  { id: 'investments', label: 'Investments & ROI', icon: TrendingUp },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'referrals', label: 'Referrals', icon: Users },
  { id: 'admin', label: 'Admin actions', icon: Settings },
];

function txStatusTone(status: Transaction['status']) {
  if (status === 'completed') return 'success' as const;
  if (status === 'rejected') return 'danger' as const;
  return 'warning' as const;
}

function txTypeTone(type: Transaction['type']) {
  if (type === 'deposit') return 'success' as const;
  if (type === 'withdrawal') return 'warning' as const;
  return 'info' as const;
}

function DetailField({
  label,
  value,
  mono,
  className = '',
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-semibold uppercase text-stone-400">{label}</dt>
      <dd className={`mt-1 text-sm text-stone-800 ${mono ? 'font-mono text-xs break-all' : ''}`}>
        {value ?? '—'}
      </dd>
    </div>
  );
}

export function MemberDetailTab({
  user,
  onBack,
  balanceAdjust,
  onBalanceAdjustChange,
  onAdjustBalance,
  onDeactivate,
  onRemove,
}: {
  user: User;
  onBack: () => void;
  balanceAdjust: { amount: string; note: string };
  onBalanceAdjustChange: (v: { amount: string; note: string }) => void;
  onAdjustBalance: (userId: string, amount: number, note: string) => void;
  onDeactivate: (userId: string, deactivated: boolean) => void | Promise<void>;
  onRemove: (userId: string) => void | Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<MemberDetailTabId>('overview');
  const [confirmAction, setConfirmAction] = useState<MemberConfirmAction | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState<FlatTransaction | null>(null);

  const portfolio = useMemo(
    () => buildPortfolioProgress(user.investments ?? []),
    [user.investments]
  );

  const allTransactions = useMemo(() => {
    return [...(user.transactions || [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [user.transactions]);

  const txTotals = useMemo(() => {
    const sum = (type: Transaction['type'], status?: Transaction['status']) =>
      allTransactions
        .filter((t) => t.type === type && (status ? t.status === status : true))
        .reduce((s, t) => s + t.amount, 0);
    return {
      deposits: sum('deposit'),
      withdrawals: sum('withdrawal'),
      investments: sum('investment'),
      pendingDeposits: sum('deposit', 'pending'),
      pendingWithdrawals: sum('withdrawal', 'pending'),
    };
  }, [allTransactions]);

  const referrals = user.referrals ?? [];
  const activeReferrals = referrals.filter((r) => r.status === 'active').length;
  const pendingReferrals = referrals.filter((r) => r.status === 'pending').length;
  const totalReferralBonus = referrals.reduce((sum, r) => sum + (r.bonusEarned || 0), 0);

  const investmentsList = useTableList<(typeof portfolio.rows)[number]>({
    items: portfolio.rows,
    pageSize: 6,
    getItemDate: (row) => row.investment.date,
  });

  const transactionsList = useTableList<Transaction>({
    items: allTransactions,
    pageSize: 10,
    filterFn: (t, f) => f === 'all' || t.type === f,
    getItemDate: (t) => t.date,
  });

  const referralsList = useTableList<Referral>({
    items: referrals,
    pageSize: 8,
    getSortValue: (ref) => ref.friendName.toLowerCase(),
  });

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
        onBack();
      }
      setConfirmAction(null);
    } finally {
      setConfirmLoading(false);
    }
  };

  const openTxDetail = (tx: Transaction) => {
    setSelectedTx({
      ...tx,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
    });
  };

  const canOpenMemberDashboard = user.role !== 'admin' && !user.isDeactivated;

  const openMemberDashboard = async () => {
    if (!canOpenMemberDashboard) {
      toast.error(
        user.isDeactivated
          ? 'This account is deactivated.'
          : 'Cannot open the member dashboard for an admin account.'
      );
      return;
    }
    try {
      const { token } = await api.adminImpersonateMember(user.id);
      const url = buildMemberDashboardHandoffUrl(token, 'overview');
      window.open(url, '_blank', 'noopener,noreferrer');
      toast.success(`Opening dashboard as ${user.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not sign in as member');
    }
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#7f4e1c] hover:text-[#633a11] cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to users
      </button>

      <div className={`${adminCard} p-5 sm:p-6`}>
        <div className="flex flex-wrap gap-4 items-start justify-between">
          <div className="flex gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-[#f8f1e8] border border-[#d8cec1] flex items-center justify-center shrink-0 overflow-hidden">
              {user.profileImage ? (
                <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserRound className="w-7 h-7 text-[#7f4e1c]" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-bold text-xl text-stone-900">{user.name}</h2>
              <p className="text-stone-600">{user.email}</p>
              {user.phone && <p className="text-sm text-stone-500 mt-0.5">{user.phone}</p>}
              <p className="text-xs font-mono text-stone-400 mt-1 break-all">{user.id}</p>
            </div>
          </div>
          <div className="flex flex-col items-stretch sm:items-end gap-3 shrink-0">
            <button
              type="button"
              onClick={() => void openMemberDashboard()}
              disabled={!canOpenMemberDashboard}
              title={
                canOpenMemberDashboard
                  ? 'Open member site signed in as this user'
                  : user.isDeactivated
                    ? 'Account is deactivated'
                    : 'Not available for admin accounts'
              }
              className={`${adminBtnPrimary} inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm whitespace-nowrap`}
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              Sign in to member dashboard
            </button>
            <div className="flex flex-wrap gap-2 justify-end">
              <AdminBadge tone={user.isDeactivated ? 'danger' : 'success'}>
                {user.isDeactivated ? 'Deactivated' : 'Active'}
              </AdminBadge>
              <AdminBadge tone={kycBadgeTone(user.kycStatus)}>
                KYC: {(user.kycStatus || 'not_started').replace(/_/g, ' ')}
              </AdminBadge>
            </div>
          </div>
        </div>
      </div>

      <nav
        className="flex gap-1 overflow-x-auto scrollbar-none p-1 bg-stone-100 rounded-xl border border-stone-200"
        aria-label="Member detail sections"
      >
        {MEMBER_DETAIL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#7f4e1c] text-white shadow-sm'
                : 'text-stone-600 hover:bg-white hover:text-[#7f4e1c]'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Wallet balance', value: formatINR(user.balance), icon: Wallet },
              { label: 'Total invested', value: formatINR(portfolio.totalInvested), icon: TrendingUp },
              {
                label: 'ROI earned (est.)',
                value: formatINR(portfolio.earnedToDate),
                icon: TrendingUp,
              },
              { label: 'Referrals', value: String(referrals.length), icon: Users },
              {
                label: 'Transactions',
                value: String(allTransactions.length),
                icon: Receipt,
              },
              {
                label: 'Projected profit (60 mo.)',
                value: formatINR(portfolio.projectedProfit),
                icon: Wallet,
              },
            ].map((item) => (
              <div key={item.label} className={`${adminCard} p-4 flex items-center gap-3`}>
                <item.icon className="w-5 h-5 text-[#7f4e1c] shrink-0" />
                <div>
                  <p className="text-xs font-semibold uppercase text-stone-400">{item.label}</p>
                  <p className="font-display font-bold text-lg text-stone-900">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={`${adminCard} p-5`}>
            <h3 className={adminTypography.sectionTitle}>Account snapshot</h3>
            <dl className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <DetailField label="Active investment plans" value={portfolio.activePlans} />
              <DetailField label="Completed tenures" value={portfolio.completedPlans} />
              <DetailField
                label="Overall plan progress"
                value={`${portfolio.overallProgressPercent}%`}
              />
              <DetailField label="Total deposits" value={formatINR(txTotals.deposits)} />
              <DetailField label="Total withdrawals" value={formatINR(txTotals.withdrawals)} />
              <DetailField
                label="Pending deposit / withdrawal"
                value={`${formatINR(txTotals.pendingDeposits)} / ${formatINR(txTotals.pendingWithdrawals)}`}
              />
              <DetailField label="Referral bonuses" value={formatINR(totalReferralBonus)} />
              <DetailField
                label="Program terms"
                value={`${(PLAN_MONTHLY_RATE * 100).toFixed(0)}% monthly · ${PLAN_TENURE_MONTHS} months`}
              />
            </dl>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="space-y-6">
          <section className={`${adminCard} p-5 space-y-4`}>
            <h3 className={adminTypography.sectionTitle}>Account profile</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailField label="Display name" value={user.name} />
              <DetailField label="Email" value={user.email} />
              <DetailField label="Phone" value={user.phone || '—'} />
              <DetailField label="Wallet address" value={user.walletAddress} mono />
              <DetailField label="Referral link" value={user.referralLink || '—'} mono />
              <DetailField label="Member ID" value={user.id} mono />
            </dl>
          </section>

          <section className={`${adminCard} p-5 space-y-4`}>
            <h3 className={adminTypography.sectionTitle}>KYC status</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailField
                label="Status"
                value={
                  <AdminBadge tone={kycBadgeTone(user.kycStatus)}>
                    {(user.kycStatus || 'not_started').replace(/_/g, ' ')}
                  </AdminBadge>
                }
              />
              <DetailField label="Certificate ID" value={user.kycVerificationNumber || '—'} mono />
              {user.kycRejectionReason && (
                <DetailField
                  label="Rejection reason"
                  value={<span className="text-red-700">{user.kycRejectionReason}</span>}
                  className="sm:col-span-2"
                />
              )}
            </dl>
          </section>

          {user.kycDetails && (
            <section className={`${adminCard} p-5 space-y-4`}>
              <h3 className={adminTypography.sectionTitle}>Submitted KYC details</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailField label="Legal name" value={user.kycDetails.fullName} />
                <DetailField label="Date of birth" value={user.kycDetails.dob} />
                <DetailField label="Gender" value={user.kycDetails.gender} />
                <DetailField label="Phone (KYC)" value={user.kycDetails.phone} />
                <DetailField
                  label="Document"
                  value={`${user.kycDetails.docType} · ${user.kycDetails.docNumber}`}
                />
                <DetailField label="Document file" value={user.kycDetails.docFileName} />
                <DetailField
                  label="Address"
                  value={`${user.kycDetails.address}, ${user.kycDetails.city}, ${user.kycDetails.state} ${user.kycDetails.pincode}`}
                  className="sm:col-span-2"
                />
                <DetailField
                  label="Submitted at"
                  value={new Date(user.kycDetails.submittedAt).toLocaleString('en-IN')}
                />
              </dl>
            </section>
          )}

          {user.kycHistory && user.kycHistory.length > 0 && (
            <section className={`${adminCard} p-5 space-y-4`}>
              <h3 className={adminTypography.sectionTitle}>KYC submission history</h3>
              <div className="space-y-3">
                {user.kycHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 rounded-xl border border-stone-100 bg-stone-50/80 text-sm"
                  >
                    <div className="flex flex-wrap gap-2 items-center justify-between">
                      <AdminBadge
                        tone={
                          entry.status === 'verified'
                            ? 'success'
                            : entry.status === 'rejected'
                              ? 'danger'
                              : 'warning'
                        }
                      >
                        {entry.status}
                      </AdminBadge>
                      <span className="text-xs font-mono text-stone-500">{entry.certificateId}</span>
                    </div>
                    <p className="text-xs text-stone-500 mt-2">
                      Submitted {new Date(entry.submittedAt).toLocaleString('en-IN')}
                      {entry.reviewedAt &&
                        ` · Reviewed ${new Date(entry.reviewedAt).toLocaleString('en-IN')}`}
                    </p>
                    {entry.rejectionReason && (
                      <p className="text-xs text-red-700 mt-2">{entry.rejectionReason}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {activeTab === 'investments' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total principal', value: formatINR(portfolio.totalInvested) },
              { label: 'Earned to date (est.)', value: formatINR(portfolio.earnedToDate) },
              { label: 'Projected profit', value: formatINR(portfolio.projectedProfit) },
              { label: 'At maturity (est.)', value: formatINR(portfolio.projectedTotalEarnings) },
            ].map((item) => (
              <div key={item.label} className={`${adminCard} p-4`}>
                <p className="text-xs font-semibold uppercase text-stone-400">{item.label}</p>
                <p className="font-display font-bold text-lg text-[#7f4e1c] mt-1">{item.value}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-stone-500">
            Each plan uses {(PLAN_MONTHLY_RATE * 100).toFixed(0)}% monthly ROI over {PLAN_TENURE_MONTHS}{' '}
            months. Platform / maintenance fees on record: <strong className="text-stone-700">₹0</strong>{' '}
            (fully managed program).
          </p>

          {portfolio.rows.length === 0 ? (
            <div className={`${adminCard} p-8 text-center text-stone-500 text-sm`}>
              No investment plans on record.
            </div>
          ) : (
            <div className="space-y-4">
              <TableDateSortControls
                dateFilter={investmentsList.dateFilter}
                onDateFilterChange={investmentsList.setDateFilter}
                sortOrder={investmentsList.sortOrder}
                onSortOrderChange={investmentsList.setSortOrder}
                variant="admin"
                className="mb-2"
              />
              {investmentsList.paginated.map((row) => (
                <article key={row.investment.id} className={`${adminCard} p-5 space-y-4`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-mono text-stone-400">{row.investment.id}</p>
                      <h4 className="font-display font-bold text-xl text-stone-900">
                        {row.investment.planName}
                      </h4>
                      {row.investment.planId && (
                        <p className="text-xs font-mono text-stone-500 mt-0.5">
                          Plan ID: {row.investment.planId}
                        </p>
                      )}
                      <p className="text-xs text-stone-500 mt-1">
                        Started {new Date(row.investment.date).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <AdminBadge tone={row.status === 'completed' ? 'success' : 'info'}>
                      {row.status === 'completed' ? 'Tenure complete' : 'Active'}
                    </AdminBadge>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-stone-600 mb-1">
                      <span>
                        Month {row.monthsElapsed} / {row.tenureMonths}
                      </span>
                      <span>{row.progressPercent}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#7f4e1c]"
                        style={{ width: `${row.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[640px]">
                      <thead>
                        <tr className="text-xs uppercase text-stone-400 border-b border-stone-100">
                          <th className="text-left py-2 pr-3">Item</th>
                          <th className="text-right py-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-50">
                        <tr>
                          <td className="py-2 text-stone-700">Principal invested</td>
                          <td className="py-2 text-right font-mono font-semibold">
                            {formatINR(row.investment.amount)}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 text-stone-700">Platform / management fee</td>
                          <td className="py-2 text-right font-mono text-stone-600">{formatINR(0)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-stone-700">Net amount in plan</td>
                          <td className="py-2 text-right font-mono font-semibold">
                            {formatINR(row.investment.amount)}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 text-stone-700">
                            Monthly ROI ({(PLAN_MONTHLY_RATE * 100).toFixed(0)}%)
                          </td>
                          <td className="py-2 text-right font-mono text-[#7f4e1c]">
                            {formatINR(row.monthlyReturn)}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 text-stone-700">Earned to date (est.)</td>
                          <td className="py-2 text-right font-mono text-emerald-700">
                            {formatINR(row.earnedToDate)}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 text-stone-700">Remaining months</td>
                          <td className="py-2 text-right font-mono">{row.monthsRemaining}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-stone-700">Projected total profit (60 mo.)</td>
                          <td className="py-2 text-right font-mono">{formatINR(row.projectedProfit)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-medium text-stone-800">
                            Total at maturity (principal + profit)
                          </td>
                          <td className="py-2 text-right font-mono font-bold text-bark">
                            {formatINR(row.projectedTotalEarnings)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </article>
              ))}
              <TablePagination
                currentPage={investmentsList.page}
                totalPages={investmentsList.totalPages}
                onPageChange={investmentsList.setPage}
                totalItems={investmentsList.total}
                itemsPerPage={investmentsList.pageSize}
                label="plans"
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <TableDateSortControls
            dateFilter={transactionsList.dateFilter}
            onDateFilterChange={transactionsList.setDateFilter}
            sortOrder={transactionsList.sortOrder}
            onSortOrderChange={transactionsList.setSortOrder}
            variant="admin"
            statusFilters={(
              ['all', 'deposit', 'withdrawal', 'investment'] as const
            ).map((f) => ({
              id: f,
              label:
                f === 'all'
                  ? `All (${allTransactions.length})`
                  : `${f.charAt(0).toUpperCase() + f.slice(1)} (${allTransactions.filter((t) => t.type === f).length})`,
            }))}
            statusFilter={transactionsList.filter}
            onStatusFilterChange={transactionsList.setFilter}
            statusFilterLabel="Type"
          />

          {transactionsList.total === 0 ? (
            <div className={`${adminCard} p-8 text-center text-stone-500 text-sm`}>
              No transactions in this category.
            </div>
          ) : (
            <div className={`${adminCard} p-5`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[720px]">
                  <thead>
                    <tr className="text-xs uppercase text-stone-400 border-b border-stone-100">
                      <th className="text-left py-2 pr-3">Date</th>
                      <th className="text-left py-2 pr-3">Type</th>
                      <th className="text-left py-2 pr-3">Status</th>
                      <th className="text-right py-2 pr-3">Amount</th>
                      <th className="text-left py-2 pr-3">Details</th>
                      <th className="text-right py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionsList.paginated.map((tx) => (
                      <tr key={tx.id} className="border-b border-stone-50 last:border-0">
                        <td className="py-2.5 text-xs text-stone-500 whitespace-nowrap">
                          {new Date(tx.date).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5">
                          <AdminBadge tone={txTypeTone(tx.type)}>{tx.type}</AdminBadge>
                        </td>
                        <td className="py-2.5">
                          <AdminBadge tone={txStatusTone(tx.status)}>{tx.status}</AdminBadge>
                        </td>
                        <td className="py-2.5 text-right font-mono font-semibold text-[#7f4e1c]">
                          {tx.type === 'withdrawal' ? '−' : '+'}
                          {formatINR(tx.amount)}
                        </td>
                        <td className="py-2.5 text-xs text-stone-600 max-w-[220px] truncate">
                          {tx.details || '—'}
                        </td>
                        <td className="py-2.5 text-right">
                          <AdminDetailsButton onClick={() => openTxDetail(tx)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <TablePagination
                currentPage={transactionsList.page}
                totalPages={transactionsList.totalPages}
                onPageChange={transactionsList.setPage}
                totalItems={transactionsList.total}
                itemsPerPage={transactionsList.pageSize}
                label="transactions"
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'referrals' && (
        <section className={`${adminCard} p-5 space-y-4`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className={adminTypography.sectionTitle}>Referrals</h3>
              <p className="text-sm text-stone-500 mt-0.5">
                Direct invites via this member&apos;s referral link
              </p>
            </div>
            {referrals.length > 0 && (
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 font-semibold">
                  Total: {referrals.length}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-green-50 text-green-800 font-semibold">
                  Active: {activeReferrals}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-semibold">
                  Pending: {pendingReferrals}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#f8f1e8] text-[#7f4e1c] font-semibold">
                  Bonuses: {formatINR(totalReferralBonus)}
                </span>
              </div>
            )}
          </div>
          {referrals.length === 0 ? (
            <p className="text-sm text-stone-500">No referral connections yet.</p>
          ) : (
            <>
              <TableDateSortControls
                dateFilter={referralsList.dateFilter}
                onDateFilterChange={referralsList.setDateFilter}
                sortOrder={referralsList.sortOrder}
                onSortOrderChange={referralsList.setSortOrder}
                variant="admin"
                showDateRange={referralsList.showDateRange}
                showSort={referralsList.showSort}
              />
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[520px]">
                  <thead>
                    <tr className="text-xs uppercase text-stone-400 border-b border-stone-100">
                      <th className="text-left py-2 pr-4">Referred member</th>
                      <th className="text-left py-2 pr-4">Referral ID</th>
                      <th className="text-left py-2 pr-4">Status</th>
                      <th className="text-right py-2">Bonus earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referralsList.paginated.map((ref) => (
                      <tr key={ref.id} className="border-b border-stone-50 last:border-0">
                        <td className="py-2.5 font-medium text-stone-800">{ref.friendName}</td>
                        <td className="py-2.5 font-mono text-xs text-stone-500">
                          #REF-{ref.id.padStart(4, '0')}
                        </td>
                        <td className="py-2.5">
                          <AdminBadge tone={ref.status === 'active' ? 'success' : 'warning'}>
                            {ref.status}
                          </AdminBadge>
                        </td>
                        <td className="py-2.5 text-right font-mono text-[#7f4e1c]">
                          {ref.status === 'active' ? formatINR(ref.bonusEarned) : formatINR(0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <TablePagination
                currentPage={referralsList.page}
                totalPages={referralsList.totalPages}
                onPageChange={referralsList.setPage}
                totalItems={referralsList.total}
                itemsPerPage={referralsList.pageSize}
                label="referrals"
              />
            </>
          )}
        </section>
      )}

      {activeTab === 'admin' && (
        <section className={`${adminCard} p-5 space-y-4 max-w-xl`}>
          <h3 className={adminTypography.sectionTitle}>Admin actions</h3>
          <p className="text-sm text-stone-500">
            Balance adjustments, deactivation, and permanent removal for this member.
          </p>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-stone-500 uppercase">Adjust balance</p>
            <input
              type="number"
              placeholder="Amount (+ credit, − debit)"
              value={balanceAdjust.amount}
              onChange={(e) => onBalanceAdjustChange({ ...balanceAdjust, amount: e.target.value })}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-900 text-sm"
            />
            <input
              placeholder="Note for audit trail"
              value={balanceAdjust.note}
              onChange={(e) => onBalanceAdjustChange({ ...balanceAdjust, note: e.target.value })}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-900 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                const amt = Number(balanceAdjust.amount);
                if (!amt) {
                  toast.error('Enter an amount');
                  return;
                }
                onAdjustBalance(user.id, amt, balanceAdjust.note || 'Admin adjustment');
                onBalanceAdjustChange({ amount: '', note: '' });
              }}
              className="w-full py-2.5 rounded-lg bg-[#7f4e1c] hover:bg-[#633a11] text-white font-semibold text-sm cursor-pointer"
            >
              Apply adjustment
            </button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() =>
                setConfirmAction(
                  user.isDeactivated
                    ? { type: 'reactivate', user }
                    : { type: 'deactivate', user }
                )
              }
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition cursor-pointer ${
                user.isDeactivated
                  ? 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
            >
              {user.isDeactivated ? (
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
              onClick={() => setConfirmAction({ type: 'remove', user })}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-sm font-semibold transition cursor-pointer"
            >
              Remove user
            </button>
          </div>
        </section>
      )}

      {selectedTx && (
        <AdminTransactionDetailModal row={selectedTx} onClose={() => setSelectedTx(null)} />
      )}

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
