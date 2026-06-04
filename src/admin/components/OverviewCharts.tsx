import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { User } from '../../lib/auth';
import type { ContactInquiry } from '../../../shared/types';
import type { AdminOverviewStats } from '../../lib/adminStats';
import { computeOverviewChartData, type OverviewDateFilter } from '../../lib/adminOverviewCharts';
import { formatINR } from '../../lib/plans';
import { adminCard, adminTypography } from '../adminTheme';

function ChartCard({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`${adminCard} p-4 sm:p-5 ${className}`}>
      <h3 className={adminTypography.sectionTitle}>{title}</h3>
      {subtitle && <p className={`${adminTypography.meta} mt-0.5 mb-4`}>{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </div>
  );
}

function toNumber(value: unknown): number {
  if (Array.isArray(value)) return Number(value[0]);
  return Number(value);
}

function inrTooltip(value: unknown) {
  const n = toNumber(value);
  if (!Number.isFinite(n)) return ['—', 'Amount'];
  return [formatINR(n), 'Amount'];
}

function countTooltip(value: unknown) {
  const n = toNumber(value);
  return [Number.isFinite(n) ? n : 0, 'Count'];
}

const tooltipStyle = {
  borderRadius: '12px',
  border: '1px solid #e7e5e4',
  boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)',
  fontSize: '12px',
};

export function OverviewCharts({
  stats,
  users,
  inquiries = [],
  dateFilter,
}: {
  stats: AdminOverviewStats;
  users: User[];
  inquiries?: ContactInquiry[];
  dateFilter: OverviewDateFilter;
}) {
  const data = useMemo(
    () => computeOverviewChartData(users, stats, inquiries, dateFilter),
    [users, stats, inquiries, dateFilter]
  );

  const hasActivity = data.activityTimeline.some(
    (d) => d.deposits > 0 || d.withdrawals > 0 || d.investments > 0
  );

  const rangeSuffix = ` (${data.rangeLabel})`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className={adminTypography.sectionTitle}>Analytics</h2>
        <p className={adminTypography.meta}>
          Charts for <span className="font-semibold text-stone-700">{data.rangeLabel}</span>
          — use the date filter above the KPIs to change the range. Pie charts show current platform
          snapshots.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="KYC status" subtitle="Distribution across all members">
          {data.kycDistribution.length === 0 ? (
            <EmptyChart message="No member KYC data yet." />
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.kycDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={88}
                    paddingAngle={2}
                  >
                    {data.kycDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => countTooltip(v)} contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Member accounts" subtitle="Active vs deactivated">
          {data.memberStatus.length === 0 ? (
            <EmptyChart message="No members." />
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.memberStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={88}
                    paddingAngle={3}
                  >
                    {data.memberStatus.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => countTooltip(v)} contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Action queues" subtitle="Items needing admin attention">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.pendingQueues} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#78716c' }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#78716c' }} width={32} />
                <Tooltip formatter={(v) => countTooltip(v)} contentStyle={tooltipStyle} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {data.pendingQueues.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Platform funds" subtitle="Aggregate wallet vs invested capital">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.financialSnapshot}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e7e5e4" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#78716c' }}
                  tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
                />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: '#57534e' }} />
                <Tooltip formatter={inrTooltip} contentStyle={tooltipStyle} />
                <Bar dataKey="amount" radius={[0, 6, 6, 0]} maxBarSize={28}>
                  {data.financialSnapshot.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard
        title={data.timelineTitle}
        subtitle={data.timelineSubtitle}
        className="w-full"
      >
        {!hasActivity ? (
          <EmptyChart message={`No transactions${rangeSuffix}.`} />
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.activityTimeline} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#78716c' }} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#78716c' }}
                  tickFormatter={(v) => `₹${(Number(v) / 1000).toFixed(0)}k`}
                  width={48}
                />
                <Tooltip formatter={inrTooltip} contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  type="monotone"
                  dataKey="deposits"
                  name="Deposits"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="withdrawals"
                  name="Withdrawals"
                  stroke="#e11d48"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="investments"
                  name="Investments"
                  stroke="#7f4e1c"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Transaction volume by type"
          subtitle={`Sum of transaction amounts${rangeSuffix}`}
        >
          {data.transactionVolume.length === 0 ? (
            <EmptyChart message={`No transactions${rangeSuffix}.`} />
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.transactionVolume} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#78716c' }} />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#78716c' }}
                    tickFormatter={(v) => `₹${(Number(v) / 100000).toFixed(1)}L`}
                    width={44}
                  />
                  <Tooltip formatter={inrTooltip} contentStyle={tooltipStyle} />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={56}>
                    {data.transactionVolume.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Investments by plan tier"
          subtitle={`Principal invested${rangeSuffix}`}
        >
          {data.investmentsByPlan.length === 0 ? (
            <EmptyChart message={`No plan purchases${rangeSuffix}.`} />
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.investmentsByPlan} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#78716c' }}
                    angle={-25}
                    textAnchor="end"
                    height={56}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#78716c' }}
                    tickFormatter={(v) => `₹${(Number(v) / 100000).toFixed(1)}L`}
                    width={44}
                  />
                  <Tooltip formatter={inrTooltip} contentStyle={tooltipStyle} />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {data.investmentsByPlan.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        {data.inquiryStatus.length > 0 && (
          <ChartCard
            title="Lead inquiries"
            subtitle={`Contact form submissions${rangeSuffix}`}
          >
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.inquiryStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={88}
                    paddingAngle={2}
                  >
                    {data.inquiryStatus.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => countTooltip(v)} contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}
      </div>
    </div>
  );
}

export { OverviewDateRangeFilter } from './OverviewDateRangeFilter';

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-[220px] flex items-center justify-center text-sm text-stone-500 border border-dashed border-stone-200 rounded-xl bg-stone-50/50">
      {message}
    </div>
  );
}
