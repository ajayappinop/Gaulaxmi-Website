import React, { useCallback, useEffect, useState } from 'react';
import { Check, ChevronDown, ShieldCheck, X } from 'lucide-react';
import { api } from '../../lib/apiClient';
import type { AdminKycSubmissionRow } from '../../../shared/types';
import { toast } from 'react-hot-toast';
import { AdminTableToolbar, adminTableControlProps } from '../components/AdminTableToolbar';
import { useTableList } from '../../hooks/useTableList';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { adminTypography } from '../adminTheme';
import { AdminMemberNameLink } from '../components/AdminDataTable';

type StatusFilter = 'all' | 'submitted' | 'verified' | 'rejected';

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'submitted', label: 'Pending' },
  { id: 'verified', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

const PAGE_SIZE = 8;

function statusBadge(status: AdminKycSubmissionRow['status']) {
  if (status === 'verified') {
    return 'bg-green-50 text-green-700 border-green-200';
  }
  if (status === 'rejected') {
    return 'bg-red-50 text-red-700 border-red-200';
  }
  return 'bg-amber-50 text-amber-800 border-amber-200';
}

function statusLabel(status: 'submitted' | 'verified' | 'rejected') {
  if (status === 'verified') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  return 'Pending';
}

export function KycAdminTab({
  onViewMember,
  onApprove,
  onReject,
}: {
  onViewMember: (userId: string) => void;
  onApprove: (submissionId: string) => void | Promise<void>;
  onReject: (submissionId: string, reason: string) => void | Promise<void>;
}) {
  const [fetchedRows, setFetchedRows] = useState<AdminKycSubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getAdminKycSubmissions({
        status: statusFilter,
        search,
        page: 1,
        pageSize: 5000,
      });
      setFetchedRows(result.rows);
    } catch {
      toast.error('Could not load KYC submissions');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  const table = useTableList<AdminKycSubmissionRow>({
    items: fetchedRows,
    pageSize: PAGE_SIZE,
    getItemDate: (r) => r.submittedAt,
  });

  useEffect(() => {
    load();
  }, [load]);

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
      await load();
    } catch {
      toast.error('Could not reject submission');
    } finally {
      setSubmittingReject(false);
    }
  };

  const rows = table.paginated;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="KYC submissions"
        subtitle="Full history of pending, approved, and rejected KYC requests"
        icon={ShieldCheck}
      />

      <AdminTableToolbar
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search name, email, certificate ID, phone…"
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
        <p className="text-stone-500 text-sm py-8 text-center">Loading submissions…</p>
      ) : rows.length === 0 ? (
        <p className="text-stone-500 text-sm py-8 text-center bg-white/50 border border-stone-200 rounded-xl">
          No KYC submissions match your filters.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const isExpanded = expandedId === row.submissionId;
            return (
            <div
              key={row.submissionId}
              className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-colors ${
                isExpanded ? 'border-[#7f4e1c]/40 ring-1 ring-[#7f4e1c]/10' : 'border-stone-200'
              }`}
            >
              <button
                type="button"
                aria-expanded={isExpanded}
                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} KYC submission for ${row.userName}`}
                onClick={() => setExpandedId((id) => (id === row.submissionId ? null : row.submissionId))}
                className="w-full text-left px-4 py-3 sm:px-5 sm:py-4 flex flex-wrap items-center gap-3 justify-between hover:bg-[#f8f1e8]/50 transition group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminMemberNameLink
                      name={row.userName}
                      userId={row.userId}
                      onViewMember={onViewMember}
                    />
                    <span
                      className={`text-xs uppercase font-bold px-2 py-0.5 rounded-full border ${statusBadge(row.status)}`}
                    >
                      {statusLabel(row.status)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5 truncate">{row.userEmail}</p>
                  <p className={`${adminTypography.meta} font-mono mt-1`}>{row.certificateId}</p>
                  <p className={`${adminTypography.meta} mt-1 sm:hidden`}>
                    Submitted {new Date(row.submittedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className={`text-right ${adminTypography.meta} hidden sm:block`}>
                    <p>Submitted {new Date(row.submittedAt).toLocaleString()}</p>
                    {row.reviewedAt && (
                      <p className="text-stone-500">Reviewed {new Date(row.reviewedAt).toLocaleString()}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span
                      className={`flex items-center justify-center w-8 h-8 rounded-full border transition-colors ${
                        isExpanded
                          ? 'bg-[#7f4e1c] border-[#7f4e1c] text-white'
                          : 'bg-[#f8f1e8] border-[#d8cec1] text-[#7f4e1c] group-hover:bg-[#ede0cf]'
                      }`}
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        aria-hidden
                      />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#9a5f23]">
                      {isExpanded ? 'Hide' : 'Details'}
                    </span>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 border-t border-stone-200 pt-4 space-y-4">
                  <dl className="grid sm:grid-cols-2 gap-3 text-xs text-stone-600">
                    <div>
                      <span className="text-stone-500 block">Document</span>
                      {row.details.docType}: {row.details.docNumber}
                    </div>
                    <div>
                      <span className="text-stone-500 block">Phone</span>
                      {row.details.phone}
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-stone-500 block">Address</span>
                      {row.details.address}, {row.details.city}, {row.details.state} — {row.details.pincode}
                    </div>
                    {row.reviewedBy && (
                      <div>
                        <span className="text-stone-500 block">Reviewed by</span>
                        {row.reviewedBy}
                      </div>
                    )}
                    {row.rejectionReason && (
                      <div className="sm:col-span-2">
                        <span className="text-stone-500 block">Rejection reason</span>
                        <p className="text-red-300 mt-0.5">{row.rejectionReason}</p>
                      </div>
                    )}
                  </dl>

                  {row.status === 'submitted' && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          void Promise.resolve(onApprove(row.submissionId)).then(() => load());
                        }}
                        className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold"
                      >
                        <Check className="w-4 h-4" /> Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingId(row.submissionId);
                          setRejectReason('');
                        }}
                        className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold"
                      >
                        <X className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  )}

                  {rejectingId === row.submissionId && (
                    <div className="space-y-2 pt-2 border-t border-stone-200">
                      <p className="text-xs font-semibold text-red-300 uppercase">Rejection reason (required)</p>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                        maxLength={500}
                        className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-900 outline-none focus:border-red-500/60 resize-y"
                        placeholder="Reason shown to the member on their dashboard…"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setRejectingId(null)}
                          disabled={submittingReject}
                          className="px-3 py-2 rounded-lg bg-stone-100 text-stone-600 text-xs font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => void submitReject()}
                          disabled={submittingReject || !rejectReason.trim()}
                          className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:opacity-50"
                        >
                          Confirm rejection
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}
