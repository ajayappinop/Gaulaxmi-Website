import React, { useMemo, useState } from 'react';
import type { User } from '../../lib/auth';
import { formatINR } from '../../lib/plans';
import { computeMemberNetworkSummary, type MemberNetworkSummary } from '../../lib/memberNetwork';
import {
  MemberNetworkSummaryCards,
  NETWORK_DATA_TABS,
  type NetworkDataTab,
} from '../../components/MemberNetworkOverview';
import { NetworkMemberExplorer } from '../../components/NetworkMemberExplorer';
import { AdminBadge } from './AdminDataTable';
import { adminCard, adminTypography } from '../adminTheme';
import type { NetworkIncomeRow } from '../../lib/memberNetwork';

function NetworkIncomeTable({ rows }: { rows: NetworkIncomeRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-stone-500 py-6 text-center">
        No referral income recorded for this member yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200">
      <table className="w-full text-sm min-w-[560px]">
        <thead>
          <tr className="text-xs uppercase text-stone-400 border-b border-stone-100 bg-stone-50/80">
            <th className="text-left py-2.5 px-3">Date</th>
            <th className="text-left py-2.5 px-3">Type</th>
            <th className="text-left py-2.5 px-3">From member</th>
            <th className="text-left py-2.5 px-3">Description</th>
            <th className="text-right py-2.5 px-3">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50">
              <td className="py-2.5 px-3 text-stone-600 whitespace-nowrap">
                {new Date(row.date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </td>
              <td className="py-2.5 px-3">
                <AdminBadge tone={row.kind === 'direct' ? 'success' : 'info'}>
                  {row.kind}
                </AdminBadge>
              </td>
              <td className="py-2.5 px-3 text-stone-700">{row.memberName ?? '—'}</td>
              <td className="py-2.5 px-3 text-stone-600">{row.label}</td>
              <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700">
                +{formatINR(row.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminNetworkDataPanel({
  summary,
  dataTab,
  user,
}: {
  summary: MemberNetworkSummary;
  dataTab: NetworkDataTab;
  user: User;
}) {
  const explorerProps = {
    summary,
    referrals: user.referrals ?? [],
    viewerName: user.name,
    perspective: 'admin' as const,
  };

  if (dataTab === 'overview') {
    return (
      <div className="space-y-6">
        <NetworkMemberExplorer
          members={summary.allMembers}
          {...explorerProps}
          showReferredBy
          emptyMessage="No one in this member's network yet."
        />
        {summary.incomeRows.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-stone-800 mb-3">Recent referral income</h4>
            <NetworkIncomeTable rows={summary.incomeRows.slice(0, 8)} />
          </div>
        )}
      </div>
    );
  }

  if (dataTab === 'direct') {
    return (
      <NetworkMemberExplorer
        members={summary.directMembers}
        {...explorerProps}
        emptyMessage="No direct referrals — members who signed up via this member's link."
      />
    );
  }

  if (dataTab === 'indirect') {
    return (
      <NetworkMemberExplorer
        members={summary.indirectMembers}
        {...explorerProps}
        showReferredBy
        emptyMessage="No indirect referrals in the downline yet."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <p className="text-xs font-semibold uppercase text-emerald-700">Direct income</p>
          <p className="text-2xl font-display font-bold text-emerald-800 mt-1">
            {formatINR(summary.directEarnings)}
          </p>
          <p className="text-[11px] text-emerald-700/80 mt-1">From level-1 referrals</p>
        </div>
        <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4">
          <p className="text-xs font-semibold uppercase text-sky-700">Indirect income</p>
          <p className="text-2xl font-display font-bold text-sky-800 mt-1">
            {formatINR(summary.indirectEarnings)}
          </p>
          <p className="text-[11px] text-sky-700/80 mt-1">From team / downline bonuses</p>
        </div>
      </div>
      <NetworkIncomeTable rows={summary.incomeRows} />
    </div>
  );
}

export function AdminMemberNetworkPanel({ user }: { user: User }) {
  const [dataTab, setDataTab] = useState<NetworkDataTab>('overview');
  const summary = useMemo(() => computeMemberNetworkSummary(user), [user]);

  return (
    <div className="space-y-5">
      <div className={`${adminCard} p-4 sm:p-5`}>
        <h3 className={adminTypography.sectionTitle}>Referral network summary</h3>
        <p className="text-sm text-stone-500 mt-0.5 mb-4">
          Direct and indirect referrals, investments, and income earned by {user.name}
        </p>
        <dl className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5 text-sm">
          <div className="rounded-lg bg-stone-50 border border-stone-100 px-3 py-2">
            <dt className="text-[10px] font-semibold uppercase text-stone-400">Sponsor</dt>
            <dd className="mt-0.5 font-medium text-stone-800">
              {user.referredByName ?? 'None (root member)'}
            </dd>
            {user.referredByUserId && (
              <dd className="text-[10px] font-mono text-stone-400 mt-0.5">{user.referredByUserId}</dd>
            )}
          </div>
          <div className="rounded-lg bg-stone-50 border border-stone-100 px-3 py-2">
            <dt className="text-[10px] font-semibold uppercase text-stone-400">Referral link</dt>
            <dd className="mt-0.5 font-mono text-[11px] text-stone-600 break-all">
              {user.referralLink || '—'}
            </dd>
          </div>
          <div className="rounded-lg bg-stone-50 border border-stone-100 px-3 py-2">
            <dt className="text-[10px] font-semibold uppercase text-stone-400">Network active</dt>
            <dd className="mt-0.5 font-medium text-stone-800">
              {summary.activeCount} active · {summary.pendingCount} pending
            </dd>
          </div>
          <div className="rounded-lg bg-stone-50 border border-stone-100 px-3 py-2">
            <dt className="text-[10px] font-semibold uppercase text-stone-400">Total referral income</dt>
            <dd className="mt-0.5 font-display font-bold text-[#7f4e1c]">
              {formatINR(summary.totalNetworkEarnings)}
            </dd>
          </div>
        </dl>
        <MemberNetworkSummaryCards summary={summary} />
      </div>

      <section className={`${adminCard} p-4 sm:p-5 space-y-4`}>
        <nav className="flex flex-wrap gap-2 border-b border-stone-100 pb-3">
          {NETWORK_DATA_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setDataTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                dataTab === tab.id
                  ? 'bg-[#7f4e1c] text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <AdminNetworkDataPanel summary={summary} dataTab={dataTab} user={user} />
      </section>
    </div>
  );
}
