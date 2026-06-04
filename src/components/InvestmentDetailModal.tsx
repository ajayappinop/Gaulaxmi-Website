import React from 'react';
import { CheckCircle } from 'lucide-react';
import { DetailModalShell } from './DetailModalShell';
import { formatINR } from '../lib/plans';
import type { Investment } from '../lib/auth';

export function InvestmentDetailModal({
  investment,
  onClose,
}: {
  investment: Investment;
  onClose: () => void;
}) {
  const date = new Date(investment.date);

  return (
    <DetailModalShell title="Investment details" subtitle={investment.id} onClose={onClose}>
      <div className="space-y-5">
        <div className="rounded-2xl p-4 bg-[#f8f1e8] border border-[#d8cec1] flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#7f4e1c]/15 text-[#7f4e1c] flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-stone-500">Plan</p>
            <p className="text-xl font-display font-bold text-bark">{investment.planName}</p>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase text-stone-400">Invested amount</dt>
            <dd className="mt-1 font-display font-bold text-[#7f4e1c] text-lg">
              {formatINR(investment.amount)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-stone-400">Status</dt>
            <dd className="mt-1">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200">
                Active
              </span>
            </dd>
          </div>
          {investment.planId && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase text-stone-400">Plan ID</dt>
              <dd className="mt-1 font-mono text-xs text-stone-700 break-all">{investment.planId}</dd>
            </div>
          )}
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase text-stone-400">Purchase date</dt>
            <dd className="mt-1 text-stone-800">
              {date.toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              <span className="block text-stone-600 text-sm mt-0.5">
                {date.toLocaleTimeString('en-IN')}
              </span>
            </dd>
          </div>
        </dl>

        <p className="text-sm text-stone-600 bg-stone-50 border border-stone-100 rounded-xl px-4 py-3">
          This investment earns 5% monthly ROI for the plan tenure. Returns are credited per your
          Gaulaxmi program terms.
        </p>
      </div>
    </DetailModalShell>
  );
}
