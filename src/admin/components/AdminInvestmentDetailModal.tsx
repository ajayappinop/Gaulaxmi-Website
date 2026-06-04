import React from 'react';
import { DetailModalShell } from '../../components/DetailModalShell';
import { formatINR } from '../../lib/plans';
import type { FlatInvestment } from '../../lib/adminStats';
import { AdminMemberNameLink } from './AdminDataTable';

export function AdminInvestmentDetailModal({
  row,
  onClose,
  onViewMember,
}: {
  row: FlatInvestment;
  onClose: () => void;
  onViewMember?: (userId: string) => void;
}) {
  const date = new Date(row.date);

  return (
    <DetailModalShell title="Plan purchase" subtitle={row.id} onClose={onClose}>
      <div className="space-y-5">
        <div className="text-sm">
          <p className="text-xs font-semibold uppercase text-stone-400">Member</p>
          <AdminMemberNameLink
            name={row.userName}
            userId={row.userId}
            onViewMember={onViewMember}
          />
          <p className="text-xs text-stone-500">{row.userEmail}</p>
          <p className="text-xs font-mono text-stone-400 mt-1">{row.userId}</p>
        </div>

        <div className="rounded-2xl p-4 bg-[#f8f1e8] border border-[#d8cec1]">
          <p className="text-xs font-semibold uppercase text-stone-500">Plan tier</p>
          <p className="text-xl font-display font-bold text-bark">{row.planName}</p>
          {row.planId && (
            <p className="text-xs font-mono text-stone-500 mt-1 break-all">{row.planId}</p>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase text-stone-400">Amount</dt>
            <dd className="mt-1 font-display font-bold text-[#7f4e1c]">{formatINR(row.amount)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-stone-400">Purchase date</dt>
            <dd className="mt-1">{date.toLocaleString('en-IN')}</dd>
          </div>
        </dl>
      </div>
    </DetailModalShell>
  );
}
