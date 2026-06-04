import React, { useEffect, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle,
  Clock,
  ImageIcon,
  XCircle,
} from 'lucide-react';
import { api } from '../lib/apiClient';
import { DetailModalShell } from './DetailModalShell';
import { DepositRequestDetailModal } from './DepositRequestDetailModal';
import { formatINR } from '../lib/plans';
import type { Transaction } from '../lib/auth';
import type { DepositRequest } from '../../shared/types';

function statusTone(status: Transaction['status']) {
  if (status === 'completed') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  if (status === 'rejected') return 'bg-red-50 text-red-800 border-red-200';
  return 'bg-amber-50 text-amber-800 border-amber-200';
}

function statusIcon(status: Transaction['status']) {
  if (status === 'completed') return <CheckCircle className="w-4 h-4" />;
  if (status === 'rejected') return <XCircle className="w-4 h-4" />;
  return <Clock className="w-4 h-4" />;
}

function statusHelp(tx: Transaction) {
  if (tx.type === 'deposit') {
    if (tx.status === 'pending') {
      return 'Your deposit is awaiting admin verification. Funds will be added to your wallet once approved.';
    }
    if (tx.status === 'rejected') {
      return 'This deposit was rejected. Check your deposit request history for the admin reason.';
    }
    return 'This deposit has been credited to your wallet balance.';
  }
  if (tx.status === 'pending') {
    return 'Your withdrawal request is pending admin approval.';
  }
  if (tx.status === 'rejected') {
    return 'This withdrawal was rejected. The amount was returned to your wallet.';
  }
  return 'This withdrawal has been processed.';
}

export function WalletTransactionDetailModal({
  transaction,
  onClose,
}: {
  transaction: Transaction;
  onClose: () => void;
}) {
  const [depositRequest, setDepositRequest] = useState<DepositRequest | null>(null);
  const [loadingExtra, setLoadingExtra] = useState(transaction.type === 'deposit');

  const [showDepositModal, setShowDepositModal] = useState(false);

  useEffect(() => {
    if (transaction.type !== 'deposit') {
      setLoadingExtra(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const requests = await api.getMyDepositRequests();
        if (cancelled) return;
        const linked =
          requests.find((r) => r.transactionId === transaction.id) ??
          (transaction.depositRequestId
            ? requests.find((r) => r.id === transaction.depositRequestId)
            : undefined) ??
          null;
        setDepositRequest(linked);
      } catch {
        setDepositRequest(null);
      } finally {
        if (!cancelled) setLoadingExtra(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [transaction]);

  const date = new Date(transaction.date);
  const isDeposit = transaction.type === 'deposit';

  if (showDepositModal && depositRequest) {
    return (
      <DepositRequestDetailModal request={depositRequest} onClose={() => setShowDepositModal(false)} />
    );
  }

  return (
    <DetailModalShell
      title={`${transaction.type} details`}
      subtitle={transaction.id}
      onClose={onClose}
    >
      <div className="space-y-5">
          <div
            className={`rounded-2xl p-4 border flex items-center gap-3 ${
              isDeposit ? 'bg-green-50/80 border-green-100' : 'bg-orange-50/80 border-orange-100'
            }`}
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                isDeposit ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-[#7b3f08]'
              }`}
            >
              {isDeposit ? (
                <ArrowDownRight className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-stone-500">Amount</p>
              <p
                className={`text-2xl font-display font-bold ${
                  isDeposit ? 'text-green-700' : 'text-[#7b3f08]'
                }`}
              >
                {isDeposit ? '+' : '-'}
                {formatINR(transaction.amount)}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase text-stone-400">Status</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${statusTone(transaction.status)}`}
                >
                  {statusIcon(transaction.status)}
                  {transaction.status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-stone-400">Type</dt>
              <dd className="mt-1 font-medium text-stone-900 capitalize">{transaction.type}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase text-stone-400">Date & time</dt>
              <dd className="mt-1 text-stone-800">
                {date.toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                <span className="block text-stone-600 text-sm mt-0.5">
                  {date.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </dd>
            </div>
            {transaction.depositRequestId && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase text-stone-400">Deposit request ID</dt>
                <dd className="mt-1 font-mono text-xs text-stone-700 break-all">
                  {transaction.depositRequestId}
                </dd>
              </div>
            )}
          </dl>

          <div>
            <p className="text-xs font-semibold uppercase text-stone-400 mb-1">Description</p>
            <p className="text-sm text-stone-800 bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 whitespace-pre-wrap break-words">
              {transaction.details?.trim() || 'No additional description.'}
            </p>
          </div>

          <p className="text-sm text-stone-600 bg-[#f8f1e8] border border-[#eae0d5] rounded-xl px-4 py-3">
            {statusHelp(transaction)}
          </p>

          {transaction.type === 'deposit' && (
            <div className="border-t border-stone-100 pt-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-stone-400">
                Deposit request
              </p>
              {loadingExtra ? (
                <p className="text-sm text-stone-500">Loading deposit details…</p>
              ) : depositRequest ? (
                <>
                  <p className="text-sm text-stone-600">
                    UTR: <span className="font-mono">{depositRequest.utr || '—'}</span> · Status:{' '}
                    {depositRequest.status}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDepositModal(true)}
                    className="w-full py-2.5 rounded-xl border border-[#d8cec1] bg-[#f8f1e8] text-[#7b4b1d] text-sm font-semibold hover:bg-[#ede0cf] cursor-pointer inline-flex items-center justify-center gap-1"
                  >
                    <ImageIcon className="w-4 h-4" />
                    View full deposit proof
                  </button>
                </>
              ) : (
                <p className="text-sm text-stone-500">No linked deposit request found for this entry.</p>
              )}
            </div>
          )}
      </div>
    </DetailModalShell>
  );
}
