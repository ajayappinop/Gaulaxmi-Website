import React from 'react';
import { ArrowUpRight, ChevronRight, GitBranch, Layers, TrendingUp, Users } from 'lucide-react';
import { formatINR } from '../lib/plans';
import type { MemberOverviewKpis } from '../lib/memberOverviewKpis';
import type { DashboardTabId } from '../lib/dashboardNav';

function KpiCard({
  label,
  value,
  sub,
  icon,
  accent = 'stone',
  onClick,
  viewLabel,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent?: 'stone' | 'green' | 'amber' | 'brown';
  onClick?: () => void;
  viewLabel?: string;
}) {
  const accentClass =
    accent === 'green'
      ? 'text-emerald-600'
      : accent === 'amber'
        ? 'text-[#7f4e1c]'
        : accent === 'brown'
          ? 'text-[#7b3f08]'
          : 'text-stone-900';

  const className =
    'bg-white border border-stone-200 rounded-2xl sm:rounded-3xl p-5 shadow-sm flex flex-col justify-between min-h-[7.5rem] w-full text-left transition-all duration-200';

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-stone-400 mb-1.5">
            {label}
          </div>
          <div className={`text-2xl sm:text-3xl font-display font-bold truncate ${accentClass}`}>
            {value}
          </div>
          {sub && (
            <p className="text-[11px] text-stone-500 mt-1.5 leading-snug line-clamp-2">{sub}</p>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#f8f1e8] border border-[#edd8c4] flex items-center justify-center text-[#7f4e1c] shrink-0 group-hover:bg-[#ede0cf] transition-colors">
          {icon}
        </div>
      </div>
      {onClick && viewLabel && (
        <p className="mt-3 pt-3 border-t border-stone-100 text-[11px] font-semibold text-[#7f4e1c] flex items-center gap-1 group-hover:gap-1.5 transition-all">
          {viewLabel}
          <ChevronRight className="w-3.5 h-3.5" aria-hidden />
        </p>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${className} cursor-pointer hover:border-[#7f4e1c]/35 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7f4e1c]/40 group`}
        aria-label={`${label}: ${value}. ${viewLabel ?? 'View details'}`}
      >
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

export function MemberOverviewKpiGrid({
  kpis,
  onNavigate,
}: {
  kpis: MemberOverviewKpis;
  onNavigate?: (tab: DashboardTabId) => void;
}) {
  const plansSub =
    kpis.activePlans === 0
      ? 'No plans in this period'
      : kpis.planNames.length <= 2
        ? kpis.planNames.join(', ')
        : `${kpis.planNames.slice(0, 2).join(', ')} +${kpis.planNames.length - 2} more`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      <KpiCard
        label="Direct income"
        value={formatINR(kpis.directIncome)}
        sub="Referral & direct network bonuses"
        icon={<Users className="w-5 h-5" />}
        accent="green"
        onClick={onNavigate ? () => onNavigate('referrals') : undefined}
        viewLabel="View referrals"
      />
      <KpiCard
        label="Indirect income"
        value={formatINR(kpis.indirectIncome)}
        sub="Team / downline level earnings"
        icon={<GitBranch className="w-5 h-5" />}
        accent="green"
        onClick={onNavigate ? () => onNavigate('hierarchy') : undefined}
        viewLabel="View my network"
      />
      <KpiCard
        label="Total investment"
        value={formatINR(kpis.totalInvestment)}
        sub={`${kpis.activePlans} plan${kpis.activePlans === 1 ? '' : 's'} in range`}
        icon={<TrendingUp className="w-5 h-5" />}
        accent="brown"
        onClick={onNavigate ? () => onNavigate('investments') : undefined}
        viewLabel="View investments"
      />
      <KpiCard
        label="Total withdrawal"
        value={formatINR(kpis.totalWithdrawal)}
        sub="Completed & pending requests"
        icon={<ArrowUpRight className="w-5 h-5" />}
        accent="amber"
        onClick={onNavigate ? () => onNavigate('transactions') : undefined}
        viewLabel="View transactions"
      />
      <KpiCard
        label="Plans"
        value={String(kpis.activePlans)}
        sub={plansSub}
        icon={<Layers className="w-5 h-5" />}
        accent="brown"
        onClick={onNavigate ? () => onNavigate('progress') : undefined}
        viewLabel="View plan progress"
      />
    </div>
  );
}
