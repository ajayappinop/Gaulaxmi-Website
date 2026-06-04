import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import { DetailModalShell } from '../../components/DetailModalShell';
import { DepositRequestDetailModal } from '../../components/DepositRequestDetailModal';
import { formatINR } from '../../lib/plans';
import type { FlatTransaction } from '../../lib/adminStats';
import type { DepositRequest } from '../../../shared/types';
import { AdminMemberNameLink } from './AdminDataTable';

function statusBadge(status: string) {
  if (status === 'completed') return 'bg-green-50 text-green-800 border-green-200';
  if (status === 'rejected') return 'bg-red-50 text-red-800 border-red-200';
  return 'bg-amber-50 text-amber-800 border-amber-200';
}

export function AdminTransactionDetailModal({
  row,
  onClose,
  onViewMember,
}: {
  row: FlatTransaction;
  onClose: () => void;
  onViewMember?: (userId: string) => void;
}) {
  const [depositRequest, setDepositRequest] = useState<DepositRequest | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);

  useEffect(() => {
    if (row.type !== 'deposit') return;
    let cancelled = false;
    void (async () => {
      try {
        const search = row.depositRequestId || row.id;
        const result = await api.getAdminDepositRequests({
          status: 'all',
          search,
          pageSize: 20,
        });
        if (cancelled) return;
        const linked =
          result.rows.find((r) => r.transactionId === row.id) ??
          (row.depositRequestId
            ? result.rows.find((r) => r.id === row.depositRequestId)
            : undefined) ??
          null;
        setDepositRequest(linked);
      } catch {
        setDepositRequest(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [row]);

  if (showDepositModal && depositRequest) {
    return (
      <DepositRequestDetailModal
        request={depositRequest}
        memberName={row.userName}
        memberEmail={row.userEmail}
        memberUserId={row.userId}
        onViewMember={onViewMember}
        onClose={() => setShowDepositModal(false)}
      />
    );
  }

  const date = new Date(row.date);

  return (
    <DetailModalShell
      title={`${row.type} transaction`}
      subtitle={row.id}
      onClose={onClose}
      maxWidth="max-w-xl"
    >
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

        <div className="rounded-2xl p-4 border border-stone-100 bg-stone-50">
          <p className="text-xs font-semibold uppercase text-stone-500">Amount</p>
          <p className="text-2xl font-display font-bold text-[#7f4e1c]">{formatINR(row.amount)}</p>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase text-stone-400">Type</dt>
            <dd className="mt-1 capitalize font-medium">{row.type}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-stone-400">Status</dt>
            <dd className="mt-1">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${statusBadge(row.status)}`}
              >
                {row.status}
              </span>
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs font-semibold uppercase text-stone-400">Date</dt>
            <dd className="mt-1">{date.toLocaleString('en-IN')}</dd>
          </div>
          {row.depositRequestId && (
            <div className="col-span-2">
              <dt className="text-xs font-semibold uppercase text-stone-400">Deposit request ID</dt>
              <dd className="mt-1 font-mono text-xs break-all">{row.depositRequestId}</dd>
            </div>
          )}
        </dl>

        <div>
          <p className="text-xs font-semibold uppercase text-stone-400 mb-1">Description</p>
          <p className="text-sm text-stone-800 bg-white border border-stone-100 rounded-xl px-4 py-3 whitespace-pre-wrap break-words">
            {row.details?.trim() || '—'}
          </p>
        </div>

        {row.type === 'deposit' && depositRequest && (
          <button
            type="button"
            onClick={() => setShowDepositModal(true)}
            className="w-full py-2.5 rounded-xl border border-[#d8cec1] bg-[#f8f1e8] text-[#7b4b1d] text-sm font-semibold hover:bg-[#ede0cf] cursor-pointer"
          >
            View full deposit request (screenshot & UTR)
          </button>
        )}
      </div>
    </DetailModalShell>
  );
}
