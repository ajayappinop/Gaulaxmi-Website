import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Calendar, Target, Wallet, CheckCircle2, Clock } from 'lucide-react';
import type { Investment } from '../lib/auth';
import { formatINR } from '../lib/plans';
import { buildPortfolioProgress } from '../lib/investmentProgress';
import { DetailsActionButton } from './DetailsActionButton';
import { TablePagination } from './TablePagination';
import { TableListToolbar } from './TableListToolbar';
import { useTableList } from '../hooks/useTableList';

export function InvestmentProgressTab({
  investments,
  onViewDetails,
  onBrowsePlans,
}: {
  investments: Investment[];
  onViewDetails: (inv: Investment) => void;
  onBrowsePlans?: () => void;
}) {
  const portfolio = buildPortfolioProgress(investments);
  const planList = useTableList({
    items: portfolio.rows,
    pageSize: 5,
    getItemDate: (row) => row.investment.date,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 sm:space-y-6"
    >
      <header className="space-y-1">
        <h2 className="font-display font-bold text-xl sm:text-2xl text-stone-900 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-[#7f4e1c] shrink-0" />
          Investment Progress
        </h2>
        <p className="text-sm text-stone-500">
          Track tenure, monthly ROI ({portfolio.monthlyRateLabel}), and earnings across your active
          plans ({portfolio.tenureMonths}-month program).
        </p>
      </header>

      {portfolio.rows.length === 0 ? (
        <div className="bg-white border border-border border-dashed rounded-3xl p-10 text-center shadow-sm">
          <Target className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-bold text-lg text-stone-800 mb-2">No investments yet</h3>
          <p className="text-sm text-stone-500 max-w-md mx-auto mb-6">
            Once you purchase a plan, progress and projected returns will appear here month by month.
          </p>
          {onBrowsePlans && (
            <button
              type="button"
              onClick={onBrowsePlans}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7f4e1c] text-white text-sm font-semibold hover:bg-[#633a11] cursor-pointer"
            >
              Browse investment plans
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              label="Total invested"
              value={formatINR(portfolio.totalInvested)}
              icon={Wallet}
            />
            <SummaryCard
              label="Earned to date (est.)"
              value={formatINR(portfolio.earnedToDate)}
              icon={TrendingUp}
              accent="text-emerald-700"
            />
            <SummaryCard
              label="Projected profit (60 mo.)"
              value={formatINR(portfolio.projectedProfit)}
              icon={Target}
            />
            <SummaryCard
              label="Overall tenure progress"
              value={`${portfolio.overallProgressPercent}%`}
              sub={`${portfolio.activePlans} active · ${portfolio.completedPlans} completed`}
              icon={Calendar}
            />
          </div>

          <div className="bg-white border border-[#eae0d5]/85 rounded-3xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <h3 className="font-bold text-lg text-stone-900">Portfolio timeline</h3>
              <p className="text-xs text-stone-500">
                Estimates assume {portfolio.monthlyRateLabel} monthly ROI for {portfolio.tenureMonths}{' '}
                months
              </p>
            </div>
            <div className="h-3 rounded-full bg-stone-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#7f4e1c] to-[#d4af37] transition-all"
                style={{ width: `${portfolio.overallProgressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-stone-500 mt-2 font-mono">
              <span>Start</span>
              <span>
                {formatINR(portfolio.earnedToDate)} / {formatINR(portfolio.projectedProfit)} profit
              </span>
              <span>Month {portfolio.tenureMonths}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-lg text-stone-900">Plan-by-plan progress</h3>
            <TableListToolbar
              dateFilter={planList.dateFilter}
              onDateFilterChange={planList.setDateFilter}
              sortOrder={planList.sortOrder}
              onSortOrderChange={planList.setSortOrder}
            />
            {planList.paginated.map((row) => (
              <article
                key={row.investment.id}
                className="bg-white border border-[#eae0d5]/85 rounded-2xl p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-stone-400 mb-1">{row.investment.id}</p>
                    <h4 className="font-display font-bold text-xl text-bark">{row.investment.planName}</h4>
                    <p className="text-sm text-stone-500 mt-0.5">
                      Started {new Date(row.investment.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      row.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {row.status === 'completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    {row.status === 'completed' ? 'Tenure complete' : 'Active'}
                  </span>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs font-semibold text-stone-600 mb-1.5">
                    <span>
                      Month {row.monthsElapsed} of {row.tenureMonths}
                    </span>
                    <span>{row.progressPercent}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#7f4e1c]"
                      style={{ width: `${row.progressPercent}%` }}
                    />
                  </div>
                  {row.monthsRemaining > 0 && (
                    <p className="text-xs text-stone-500 mt-1.5">
                      {row.monthsRemaining} month{row.monthsRemaining === 1 ? '' : 's'} remaining in
                      program
                    </p>
                  )}
                </div>

                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="rounded-xl bg-stone-50 border border-stone-100 px-3 py-2.5">
                    <dt className="text-[10px] uppercase font-bold text-stone-400">Principal</dt>
                    <dd className="font-semibold text-stone-900 mt-0.5">
                      {formatINR(row.investment.amount)}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-stone-50 border border-stone-100 px-3 py-2.5">
                    <dt className="text-[10px] uppercase font-bold text-stone-400">Monthly ROI</dt>
                    <dd className="font-semibold text-[#7f4e1c] mt-0.5">
                      {formatINR(row.monthlyReturn)}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-emerald-50/80 border border-emerald-100 px-3 py-2.5">
                    <dt className="text-[10px] uppercase font-bold text-emerald-700/80">Earned (est.)</dt>
                    <dd className="font-semibold text-emerald-800 mt-0.5">
                      {formatINR(row.earnedToDate)}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-[#f8f1e8] border border-[#d8cec1] px-3 py-2.5">
                    <dt className="text-[10px] uppercase font-bold text-[#7f4e1c]/80">At maturity</dt>
                    <dd className="font-semibold text-bark mt-0.5">
                      {formatINR(row.projectedTotalEarnings)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 pt-3 border-t border-stone-100 flex justify-end">
                  <DetailsActionButton onClick={() => onViewDetails(row.investment)} />
                </div>
              </article>
            ))}
            <TablePagination
              currentPage={planList.page}
              totalPages={planList.totalPages}
              onPageChange={planList.setPage}
              totalItems={planList.total}
              itemsPerPage={planList.pageSize}
              label="plans"
            />
          </div>
        </>
      )}
    </motion.div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
}) {
  return (
    <div className="bg-white border border-[#eae0d5]/85 rounded-2xl p-4 shadow-sm flex gap-3">
      <Icon className="w-5 h-5 text-[#7f4e1c] shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase text-stone-400">{label}</p>
        <p className={`font-display font-bold text-lg mt-0.5 truncate ${accent ?? 'text-stone-900'}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-stone-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
