import React from 'react';
import {
  ArrowDownRight,
  GitBranch,
  IndianRupee,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import type { Referral } from '../lib/auth';
import { formatINR } from '../lib/plans';
import type { MemberNetworkSummary, NetworkIncomeRow } from '../lib/memberNetwork';
import { NetworkMemberExplorer } from './NetworkMemberExplorer';

function StatCard({
  label,
  value,
  sub,
  icon,
  accent = 'stone',
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent?: 'green' | 'amber' | 'brown' | 'stone';
}) {
  const valueClass =
    accent === 'green'
      ? 'text-emerald-600'
      : accent === 'amber'
        ? 'text-amber-700'
        : accent === 'brown'
          ? 'text-[#7b3f08]'
          : 'text-stone-900';

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{label}</p>
          <p className={`text-xl sm:text-2xl font-display font-bold mt-1 truncate ${valueClass}`}>
            {value}
          </p>
          {sub && <p className="text-[11px] text-stone-500 mt-1">{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-xl bg-[#f8f1e8] border border-[#edd8c4] flex items-center justify-center text-[#7f4e1c] shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}

function IncomeTable({ rows }: { rows: NetworkIncomeRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-10 text-stone-500 border border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
        <IndianRupee className="w-8 h-8 mx-auto text-stone-300 mb-2" />
        <p className="text-sm">No referral income recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-200">
      <table className="w-full text-left text-sm min-w-[520px]">
        <thead>
          <tr className="bg-stone-50 border-b border-stone-200 text-[10px] font-bold uppercase tracking-wider text-stone-500">
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Description</th>
            <th className="px-4 py-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-[#faf7f2]/60 transition-colors">
              <td className="px-4 py-3 text-stone-600 whitespace-nowrap">
                {new Date(row.date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    row.kind === 'direct'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-sky-50 text-sky-700'
                  }`}
                >
                  {row.kind}
                </span>
              </td>
              <td className="px-4 py-3 text-stone-700">{row.label}</td>
              <td className="px-4 py-3 text-right font-bold text-emerald-700">
                +{formatINR(row.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type NetworkDataTab = 'overview' | 'direct' | 'indirect' | 'earnings';

export function MemberNetworkSummaryCards({ summary }: { summary: MemberNetworkSummary }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      <StatCard
        label="Direct referrals"
        value={String(summary.directCount)}
        sub={`${summary.directMembers.filter((m) => m.status === 'active').length} active`}
        icon={<UserPlus className="w-4 h-4" />}
        accent="brown"
      />
      <StatCard
        label="Indirect referrals"
        value={String(summary.indirectCount)}
        sub="Downline members"
        icon={<GitBranch className="w-4 h-4" />}
        accent="brown"
      />
      <StatCard
        label="Network size"
        value={String(summary.totalNetworkSize)}
        sub={`${summary.pendingCount} pending`}
        icon={<Users className="w-4 h-4" />}
      />
      <StatCard
        label="Direct earnings"
        value={formatINR(summary.directEarnings)}
        sub="From L1 referrals"
        icon={<TrendingUp className="w-4 h-4" />}
        accent="green"
      />
      <StatCard
        label="Indirect earnings"
        value={formatINR(summary.indirectEarnings)}
        sub="From team / downline"
        icon={<ArrowDownRight className="w-4 h-4" />}
        accent="green"
      />
      <StatCard
        label="Total earned"
        value={formatINR(summary.totalNetworkEarnings)}
        sub="All referral income"
        icon={<IndianRupee className="w-4 h-4" />}
        accent="amber"
      />
    </div>
  );
}

export function MemberNetworkDataPanel({
  summary,
  dataTab,
  referrals,
  viewerName,
}: {
  summary: MemberNetworkSummary;
  dataTab: NetworkDataTab;
  referrals: Referral[];
  viewerName: string;
}) {
  if (dataTab === 'overview') {
    return (
      <div className="space-y-6">
        <section>
          <h3 className="font-display font-bold text-base text-stone-900 mb-1">
            Your referral network at a glance
          </h3>
          <p className="text-xs text-stone-500 mb-4">
            Direct members joined via your link. Indirect members were invited by your referrals.
          </p>
          <NetworkMemberExplorer
            members={summary.allMembers}
            summary={summary}
            referrals={referrals}
            viewerName={viewerName}
            perspective="member"
            showReferredBy
            emptyMessage="No network members yet. Share your referral link to grow your team."
          />
        </section>
        {summary.incomeRows.length > 0 && (
          <section>
            <h3 className="font-display font-bold text-base text-stone-900 mb-3">
              Recent referral income
            </h3>
            <IncomeTable rows={summary.incomeRows.slice(0, 5)} />
          </section>
        )}
      </div>
    );
  }

  if (dataTab === 'direct') {
    return (
      <section>
        <h3 className="font-display font-bold text-base text-stone-900 mb-1">Direct referrals</h3>
        <p className="text-xs text-stone-500 mb-4">
          People who signed up using your referral link — and who they invited.
        </p>
        <NetworkMemberExplorer
          members={summary.directMembers}
          summary={summary}
          referrals={referrals}
          viewerName={viewerName}
          perspective="member"
          emptyMessage="No direct referrals yet."
        />
      </section>
    );
  }

  if (dataTab === 'indirect') {
    return (
      <section>
        <h3 className="font-display font-bold text-base text-stone-900 mb-1">
          Indirect referrals (downline)
        </h3>
        <p className="text-xs text-stone-500 mb-4">
          Members in your network who were referred by your direct referrals.
        </p>
        <NetworkMemberExplorer
          members={summary.indirectMembers}
          summary={summary}
          referrals={referrals}
          viewerName={viewerName}
          perspective="member"
          showReferredBy
          emptyMessage="No indirect referrals yet — they appear when your direct referrals invite others."
        />
      </section>
    );
  }

  return (
    <section>
      <h3 className="font-display font-bold text-base text-stone-900 mb-1">
        Referral income breakdown
      </h3>
      <p className="text-xs text-stone-500 mb-4">
        All bonuses credited to your wallet from direct and indirect network activity.
      </p>
      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <p className="text-[10px] font-bold uppercase text-emerald-700">Direct income</p>
          <p className="text-2xl font-display font-bold text-emerald-800 mt-1">
            {formatINR(summary.directEarnings)}
          </p>
        </div>
        <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-4">
          <p className="text-[10px] font-bold uppercase text-sky-700">Indirect income</p>
          <p className="text-2xl font-display font-bold text-sky-800 mt-1">
            {formatINR(summary.indirectEarnings)}
          </p>
        </div>
      </div>
      <IncomeTable rows={summary.incomeRows} />
    </section>
  );
}

export const NETWORK_DATA_TABS: { id: NetworkDataTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'direct', label: 'Direct' },
  { id: 'indirect', label: 'Indirect' },
  { id: 'earnings', label: 'Earnings' },
];
