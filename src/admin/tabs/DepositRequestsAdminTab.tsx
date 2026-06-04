import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDownRight, Check, X } from 'lucide-react';
import { AdminDetailsButton } from '../components/AdminDetailsButton';
import { DepositRequestDetailModal } from '../../components/DepositRequestDetailModal';
import type { DepositRequest } from '../../../shared/types';
import { toast } from 'react-hot-toast';
import { api } from '../../lib/apiClient';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminTableToolbar, adminTableControlProps } from '../components/AdminTableToolbar';
import { useTableList } from '../../hooks/useTableList';
import { formatINR } from '../../lib/plans';
import { adminCard } from '../adminTheme';
import { AdminMemberNameLink } from '../components/AdminDataTable';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

const PAGE_SIZE = 8;

function statusBadge(status: 'pending' | 'approved' | 'rejected') {
  if (status === 'approved') return 'bg-green-50 text-green-700 border-green-200';
  if (status === 'rejected') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-amber-50 text-amber-800 border-amber-200';
}

export function DepositRequestsAdminTab({
  onViewMember,
  onApprove,
  onReject,
}: {
  onViewMember: (userId: string) => void;
  onApprove: (requestId: string) => void | Promise<void>;
  onReject: (requestId: string, reason: string) => void | Promise<void>;
}) {
  const [fetchedRows, setFetchedRows] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);
  const [detailRequest, setDetailRequest] = useState<DepositRequest | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getAdminDepositRequests({
        status: statusFilter,
        search,
        page: 1,
        pageSize: 5000,
      });
      setFetchedRows(result.rows);
    } catch {
      toast.error('Could not load deposit requests');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  const table = useTableList<DepositRequest>({
    items: fetchedRows,
    pageSize: PAGE_SIZE,
    getItemDate: (r) => r.submittedAt,
  });

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    table.setPage(1);
  }, [search, statusFilter]);

  const submitReject = async () => {
    if (!rejectingId) return;
    const reason = rejectReason.trim();
    if (!reason) {
      toast.error('Please enter a rejection reason.');
      return;
    }
    setSubmittingReject(true);
    try {
      await onReject(rejectingId, reason);
      setRejectingId(null);
      setRejectReason('');
      await loadRequests();
    } catch {
      toast.error('Could not reject deposit');
    } finally {
      setSubmittingReject(false);
    }
  };

  const rows = table.paginated;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Deposit requests"
        subtitle="Review manual transfer submissions — approve to credit member wallets"
        icon={ArrowDownRight}
      />

      <p className="text-sm text-stone-500 -mt-2">
        Gateway deposits are auto-approved. Configure deposit methods under{' '}
        <strong className="text-stone-700">Payment settings</strong>.
      </p>

      <AdminTableToolbar
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search member, email, UTR, order ID…"
        filters={STATUS_FILTERS.map((f) => ({ id: f.id, label: f.label }))}
        filter={statusFilter}
        onFilterChange={(id) => {
          setStatusFilter(id as StatusFilter);
          table.setPage(1);
        }}
        total={table.total}
        page={table.page}
        totalPages={table.totalPages}
        onPageChange={table.setPage}
        pageSize={PAGE_SIZE}
        loading={loading}
        {...adminTableControlProps(table)}
      />

      {loading ? (
        <p className="text-sm text-stone-500 py-6 text-center">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-stone-500 py-6 text-center bg-white/50 border border-stone-200 rounded-xl">
          No deposit requests match your filters.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className={`${adminCard} p-4 flex flex-wrap gap-4 justify-between items-start`}
            >
              <div className="flex flex-wrap gap-4 min-w-0 flex-1">
                <div className="min-w-0 flex-1">
                  <AdminMemberNameLink
                    name={row.userName}
                    userId={row.userId}
                    onViewMember={onViewMember}
                  />
                  <p className="text-xs text-stone-500">{row.userEmail}</p>
                  <p className="font-display font-bold text-[#7f4e1c] mt-2">{formatINR(row.amount)}</p>
                  <p className="text-xs text-stone-500 mt-1">
                    {new Date(row.submittedAt).toLocaleString('en-IN')} ·{' '}
                    {row.channel === 'manual' ? 'Manual' : 'Gateway'}
                    {row.utr ? ` · UTR ${row.utr}` : ''}
                    {row.gatewayOrderId ? ` · ${row.gatewayOrderId}` : ''}
                  </p>
                  {row.paymentNote && (
                    <p className="text-xs text-stone-600 mt-1">Note: {row.paymentNote}</p>
                  )}
                  {row.rejectionReason && (
                    <p className="text-xs text-red-700 mt-1">Rejected: {row.rejectionReason}</p>
                  )}
                </div>
                {row.channel === 'manual' && !row.paymentScreenshot && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1 self-start">
                    No screenshot
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusBadge(row.status)}`}
                >
                  {row.status === 'pending'
                    ? 'Pending'
                    : row.status === 'approved'
                      ? 'Approved'
                      : 'Rejected'}
                </span>
                <AdminDetailsButton onClick={() => setDetailRequest(row)} />
                {row.status === 'pending' && row.channel === 'manual' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void onApprove(row.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingId(row.id);
                        setRejectReason('');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-100 text-stone-700 text-xs font-semibold hover:bg-red-50 hover:text-red-700 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {detailRequest && (
        <DepositRequestDetailModal
          request={detailRequest}
          memberName={detailRequest.userName}
          memberEmail={detailRequest.userEmail}
          memberUserId={detailRequest.userId}
          onViewMember={onViewMember}
          onClose={() => setDetailRequest(null)}
        />
      )}

      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h4 className="font-bold text-lg">Reject deposit</h4>
            <p className="text-sm text-stone-600">The member will see this reason in their deposit history.</p>
            <textarea
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm min-h-[100px]"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. UTR does not match bank statement"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingReject}
                onClick={() => void submitReject()}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                {submittingReject ? 'Rejecting…' : 'Confirm reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
