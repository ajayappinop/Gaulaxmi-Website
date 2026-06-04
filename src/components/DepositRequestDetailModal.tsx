import React from 'react';
import { CheckCircle, Clock, ImageIcon, XCircle } from 'lucide-react';
import { DetailModalShell } from './DetailModalShell';
import { formatINR } from '../lib/plans';
import type { DepositRequest } from '../../shared/types';
import { AdminMemberNameLink } from '../admin/components/AdminDataTable';

function statusBadge(status: DepositRequest['status']) {
  if (status === 'approved') return 'bg-green-50 text-green-700 border-green-200';
  if (status === 'rejected') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-amber-50 text-amber-800 border-amber-200';
}

export function DepositRequestDetailModal({
  request,
  onClose,
  memberName,
  memberEmail,
  memberUserId,
  onViewMember,
}: {
  request: DepositRequest;
  onClose: () => void;
  memberName?: string;
  memberEmail?: string;
  memberUserId?: string;
  onViewMember?: (userId: string) => void;
}) {
  return (
    <DetailModalShell
      title="Deposit request details"
      subtitle={request.id}
      onClose={onClose}
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        <div className="rounded-2xl p-4 bg-green-50/80 border border-green-100">
          <p className="text-xs font-semibold uppercase text-stone-500">Amount</p>
          <p className="text-2xl font-display font-bold text-green-700">{formatINR(request.amount)}</p>
        </div>

        {(memberName || memberEmail) && (
          <dl className="text-sm grid gap-2">
            <div>
              <dt className="text-xs font-semibold uppercase text-stone-400">Member</dt>
              <dd className="font-medium text-stone-900">
                {memberName ? (
                  <AdminMemberNameLink
                    name={memberName}
                    userId={memberUserId ?? request.userId}
                    onViewMember={onViewMember}
                    className="font-medium text-stone-900"
                  />
                ) : null}
              </dd>
              {memberEmail && <dd className="text-xs text-stone-500">{memberEmail}</dd>}
            </div>
          </dl>
        )}

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase text-stone-400">Status</dt>
            <dd className="mt-1">
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${statusBadge(request.status)}`}
              >
                {request.status === 'pending' && <Clock className="w-3 h-3" />}
                {request.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                {request.status === 'rejected' && <XCircle className="w-3 h-3" />}
                {request.status}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-stone-400">Channel</dt>
            <dd className="mt-1 capitalize text-stone-800">
              {request.channel === 'manual' ? 'Manual transfer' : 'Payment gateway'}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase text-stone-400">Submitted</dt>
            <dd className="mt-1 text-stone-800">
              {new Date(request.submittedAt).toLocaleString('en-IN')}
            </dd>
          </div>
          {request.transactionId && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase text-stone-400">Transaction ID</dt>
              <dd className="mt-1 font-mono text-xs break-all">{request.transactionId}</dd>
            </div>
          )}
          {request.utr && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase text-stone-400">UTR / Reference</dt>
              <dd className="mt-1 font-mono text-stone-800 break-all">{request.utr}</dd>
            </div>
          )}
          {request.gatewayOrderId && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase text-stone-400">Gateway order</dt>
              <dd className="mt-1 font-mono text-xs break-all">{request.gatewayOrderId}</dd>
            </div>
          )}
          {request.paymentNote && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase text-stone-400">Note</dt>
              <dd className="mt-1 text-stone-800 whitespace-pre-wrap">{request.paymentNote}</dd>
            </div>
          )}
          {request.reviewedAt && (
            <div>
              <dt className="text-xs font-semibold uppercase text-stone-400">Reviewed at</dt>
              <dd className="mt-1 text-stone-700">
                {new Date(request.reviewedAt).toLocaleString('en-IN')}
              </dd>
            </div>
          )}
          {request.reviewedBy && (
            <div>
              <dt className="text-xs font-semibold uppercase text-stone-400">Reviewed by</dt>
              <dd className="mt-1 text-stone-700">{request.reviewedBy}</dd>
            </div>
          )}
        </dl>

        {request.rejectionReason && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-800">
            <p className="text-xs font-semibold uppercase mb-1">Rejection reason</p>
            {request.rejectionReason}
          </div>
        )}

        {request.paymentScreenshot ? (
          <div>
            <p className="text-xs font-semibold uppercase text-stone-400 mb-2 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" /> Payment screenshot
            </p>
            <img
              src={request.paymentScreenshot}
              alt="Payment proof"
              className="w-full max-h-80 object-contain rounded-xl border border-stone-200 bg-stone-50"
            />
            {request.paymentScreenshotName && (
              <p className="text-xs text-stone-500 mt-1">{request.paymentScreenshotName}</p>
            )}
          </div>
        ) : request.channel === 'manual' ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            No payment screenshot was attached to this request.
          </p>
        ) : null}
      </div>
    </DetailModalShell>
  );
}
