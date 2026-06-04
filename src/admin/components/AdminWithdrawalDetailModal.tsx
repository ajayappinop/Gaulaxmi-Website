import React from 'react';
import { DetailModalShell } from '../../components/DetailModalShell';
import { formatINR } from '../../lib/plans';
import type { PendingWithdrawalRow } from '../../lib/adminStats';
import { AdminMemberNameLink } from './AdminDataTable';

export function AdminWithdrawalDetailModal({
  row,
  onClose,
  onViewMember,
}: {
  row: PendingWithdrawalRow;
  onClose: () => void;
  onViewMember?: (userId: string) => void;
}) {
  const { tx } = row;
  const date = new Date(tx.date);

  return (
    <DetailModalShell title="Withdrawal request" subtitle={tx.id} onClose={onClose}>
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

        <div className="rounded-2xl p-4 bg-orange-50/80 border border-orange-100">
          <p className="text-xs font-semibold uppercase text-stone-500">Requested amount</p>
          <p className="text-2xl font-display font-bold text-[#7b3f08]">{formatINR(tx.amount)}</p>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase text-stone-400">Status</dt>
            <dd className="mt-1 capitalize font-medium text-amber-800">{tx.status}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-stone-400">Requested</dt>
            <dd className="mt-1">{date.toLocaleString('en-IN')}</dd>
          </div>
        </dl>

        <div>
          <p className="text-xs font-semibold uppercase text-stone-400 mb-1">Details</p>
          <p className="text-sm text-stone-800 bg-stone-50 border border-stone-100 rounded-xl px-4 py-3">
            {tx.details?.trim() || 'No additional notes on this withdrawal request.'}
          </p>
        </div>

        <p className="text-sm text-stone-600 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          Approving marks this withdrawal as completed. Rejecting returns the amount to the
          member&apos;s wallet balance.
        </p>
      </div>
    </DetailModalShell>
  );
}
