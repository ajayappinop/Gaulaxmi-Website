import React, { useEffect, useState } from 'react';
import { Clock, History } from 'lucide-react';
import { api } from '../lib/apiClient';
import { useAuth } from '../lib/auth';
import type { KycHistoryEntry } from '../../shared/types';
import { TablePagination } from './TablePagination';
import { TableListToolbar } from './TableListToolbar';
import { useTableList } from '../hooks/useTableList';

function statusStyle(status: KycHistoryEntry['status']) {
  if (status === 'verified') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  if (status === 'rejected') return 'bg-red-50 text-red-800 border-red-200';
  return 'bg-amber-50 text-amber-800 border-amber-200';
}

function statusText(status: KycHistoryEntry['status']) {
  if (status === 'verified') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  return 'Pending review';
}

export function KycSubmissionHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<KycHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const rows = await api.getKycHistory();
        setHistory(rows);
      } catch {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.kycStatus, user?.kycHistory?.length]);

  if (loading) {
    return (
      <p className="text-sm text-stone-500 text-center py-4">Loading submission history…</p>
    );
  }

  if (history.length === 0) {
    return null;
  }

  return (
    <KycHistoryList history={history} />
  );
}

function KycHistoryList({ history }: { history: KycHistoryEntry[] }) {
  const list = useTableList({
    items: history,
    pageSize: 5,
    getItemDate: (entry) => entry.submittedAt,
  });

  return (
    <div className="mt-8 max-w-3xl">
      <h3 className="font-display font-bold text-lg text-stone-900 flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-[#7f4e1c]" /> Submission history
      </h3>
      <TableListToolbar
        dateFilter={list.dateFilter}
        onDateFilterChange={list.setDateFilter}
        sortOrder={list.sortOrder}
        onSortOrderChange={list.setSortOrder}
      />
      <div className="space-y-3">
        {list.paginated.map((entry) => (
          <div
            key={entry.id}
            className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span
                  className={`inline-flex text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${statusStyle(entry.status)}`}
                >
                  {statusText(entry.status)}
                </span>
                <p className="text-xs font-mono text-stone-500 mt-2">{entry.certificateId}</p>
              </div>
              <div className="text-right text-[11px] text-stone-500">
                <p className="flex items-center gap-1 justify-end">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(entry.submittedAt).toLocaleString()}
                </p>
                {entry.reviewedAt && (
                  <p className="mt-0.5">Reviewed {new Date(entry.reviewedAt).toLocaleString()}</p>
                )}
              </div>
            </div>
            <dl className="mt-3 grid sm:grid-cols-2 gap-2 text-xs text-stone-600">
              <div>
                <span className="text-stone-400 uppercase text-[10px] font-semibold">Name</span>
                <p className="font-medium text-stone-800">{entry.details.fullName}</p>
              </div>
              <div>
                <span className="text-stone-400 uppercase text-[10px] font-semibold">Document</span>
                <p>
                  {entry.details.docType} · {entry.details.docNumber}
                </p>
              </div>
            </dl>
            {entry.status === 'rejected' && entry.rejectionReason && (
              <p className="mt-3 text-sm text-red-800 bg-red-50 border border-red-100 rounded-lg px-3 py-2 leading-relaxed">
                <span className="font-semibold text-red-900">Rejection reason: </span>
                {entry.rejectionReason}
              </p>
            )}
            {entry.reviewedBy && entry.status !== 'submitted' && (
              <p className="mt-2 text-[10px] text-stone-400">Reviewed by {entry.reviewedBy}</p>
            )}
          </div>
        ))}
      </div>
      <TablePagination
        currentPage={list.page}
        totalPages={list.totalPages}
        onPageChange={list.setPage}
        totalItems={list.total}
        itemsPerPage={list.pageSize}
        label="submissions"
      />
    </div>
  );
}
