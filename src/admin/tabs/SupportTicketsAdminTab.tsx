import React, { useCallback, useEffect, useState } from 'react';
import { LifeBuoy } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { SupportTicket, SupportTicketStatus } from '../../../shared/types';
import { api } from '../../lib/apiClient';
import { SUPPORT_CATEGORY_OPTIONS } from '../../lib/supportFaq';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminTableToolbar, adminTableControlProps } from '../components/AdminTableToolbar';
import { useTableList } from '../../hooks/useTableList';
import { AdminDetailsButton } from '../components/AdminDetailsButton';
import {
  AdminBadge,
  AdminMemberCell,
  AdminTable,
  AdminTableCard,
  AdminTbody,
  AdminTd,
  AdminTh,
  AdminThead,
  AdminTr,
  AdminMemberNameLink,
} from '../components/AdminDataTable';
import { DetailModalShell } from '../../components/DetailModalShell';
import { adminBtnPrimary, adminBtnSecondary } from '../adminTheme';

type StatusFilter = 'all' | SupportTicketStatus;

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'closed', label: 'Closed' },
];

const PAGE_SIZE = 8;

function ticketBadgeTone(status: SupportTicketStatus): 'neutral' | 'success' | 'warning' | 'info' {
  if (status === 'resolved' || status === 'closed') return 'success';
  if (status === 'in_progress') return 'info';
  return 'warning';
}

function categoryLabel(cat: string) {
  return SUPPORT_CATEGORY_OPTIONS.find((o) => o.id === cat)?.label ?? cat;
}

export function SupportTicketsAdminTab({
  onViewMember,
}: {
  onViewMember: (userId: string) => void;
}) {
  const [fetchedRows, setFetchedRows] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState<SupportTicketStatus>('in_progress');
  const [saving, setSaving] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getAdminSupportTickets({
        status: statusFilter,
        search,
        page: 1,
        pageSize: 5000,
      });
      setFetchedRows(result.rows);
    } catch {
      toast.error('Could not load support tickets');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  const table = useTableList<SupportTicket>({
    items: fetchedRows,
    pageSize: PAGE_SIZE,
    getItemDate: (t) => t.createdAt,
  });

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    table.setPage(1);
  }, [search, statusFilter]);

  const openDetail = (t: SupportTicket) => {
    setDetail(t);
    setReply(t.adminReply ?? '');
    setStatus(t.status);
  };

  const saveTicket = async () => {
    if (!detail) return;
    const trimmedReply = reply.trim();
    if (
      (status === 'resolved' || status === 'closed') &&
      !trimmedReply
    ) {
      toast.error('Add a reply before marking resolved or closed');
      return;
    }
    setSaving(true);
    try {
      const updated = await api.adminUpdateSupportTicket(detail.id, {
        status,
        adminReply: trimmedReply,
      });
      toast.success('Ticket updated');
      setDetail(updated);
      setReply(updated.adminReply ?? '');
      setStatus(updated.status);
      await loadTickets();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const rows = table.paginated;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Help & support tickets"
        subtitle="Member support requests — reply and update status to resolve queries"
        icon={LifeBuoy}
      />

      <AdminTableCard
        toolbar={
          <AdminTableToolbar
            searchInput={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder="Search member, subject, message, ticket id…"
            filters={STATUS_FILTERS}
            filter={statusFilter}
            onFilterChange={(id) => setStatusFilter(id as StatusFilter)}
            filterLabel="Status"
            total={table.total}
            page={table.page}
            totalPages={table.totalPages}
            onPageChange={table.setPage}
            {...adminTableControlProps(table)}
          />
        }
      >
        {loading ? (
          <p className="px-5 py-10 text-sm text-stone-500">Loading tickets…</p>
        ) : fetchedRows.length === 0 ? (
          <p className="px-5 py-10 text-sm text-stone-500">No support tickets yet.</p>
        ) : rows.length === 0 ? (
          <p className="px-5 py-10 text-sm text-stone-500">No tickets match your filters.</p>
        ) : (
          <AdminTable minWidth="min-w-[800px]">
            <AdminThead>
              <tr>
                <AdminTh>Member</AdminTh>
                <AdminTh>Subject</AdminTh>
                <AdminTh>Category</AdminTh>
                <AdminTh>Status</AdminTh>
                <AdminTh>Submitted</AdminTh>
                <AdminTh align="right">Actions</AdminTh>
              </tr>
            </AdminThead>
            <AdminTbody>
              {rows.map((t) => (
                <AdminTr key={t.id}>
                  <AdminTd>
                    <AdminMemberCell
                      name={t.userName}
                      sub={t.userEmail}
                      userId={t.userId}
                      onViewMember={onViewMember}
                    />
                  </AdminTd>
                  <AdminTd>
                    <p className="font-medium text-stone-800 truncate max-w-[200px]" title={t.subject}>
                      {t.subject}
                    </p>
                    <p className="text-[10px] font-mono text-stone-400 mt-0.5">{t.id}</p>
                  </AdminTd>
                  <AdminTd className="text-xs text-stone-600">{categoryLabel(t.category)}</AdminTd>
                  <AdminTd>
                    <AdminBadge tone={ticketBadgeTone(t.status)}>
                      {t.status.replace('_', ' ')}
                    </AdminBadge>
                  </AdminTd>
                  <AdminTd className="text-xs text-stone-500 whitespace-nowrap">
                    {new Date(t.createdAt).toLocaleString('en-IN')}
                  </AdminTd>
                  <AdminTd align="right">
                    <AdminDetailsButton onClick={() => openDetail(t)} />
                  </AdminTd>
                </AdminTr>
              ))}
            </AdminTbody>
          </AdminTable>
        )}
      </AdminTableCard>

      {detail && (
        <DetailModalShell
          title={detail.subject}
          subtitle={`${categoryLabel(detail.category)} · ${detail.id}`}
          onClose={() => !saving && setDetail(null)}
          maxWidth="max-w-2xl"
          footer={
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => setDetail(null)}
                className={`${adminBtnSecondary} w-full sm:w-auto`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveTicket()}
                className={`${adminBtnPrimary} w-full sm:w-auto`}
              >
                {saving ? 'Saving…' : 'Save & notify member'}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <AdminMemberNameLink
                name={detail.userName}
                userId={detail.userId}
                onViewMember={(id) => {
                  setDetail(null);
                  onViewMember(id);
                }}
              />
              <span className="text-stone-400">·</span>
              <span className="text-stone-500 text-xs">{detail.userEmail}</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-stone-400 mb-1">Member message</p>
              <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed bg-stone-50 border border-stone-100 rounded-xl px-4 py-3">
                {detail.message}
              </p>
              <p className="text-xs text-stone-400 mt-1">
                Submitted {new Date(detail.createdAt).toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-stone-400 mb-1.5">
                Admin reply
              </label>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                maxLength={2000}
                rows={5}
                placeholder="Write your response to the member…"
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-[#7f4e1c]/50 focus:ring-2 focus:ring-[#7f4e1c]/10"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-stone-400 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SupportTicketStatus)}
                className="h-10 w-full sm:max-w-xs border border-stone-200 rounded-lg px-3 text-sm bg-white outline-none focus:border-[#7f4e1c]/50 focus:ring-2 focus:ring-[#7f4e1c]/10"
              >
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </DetailModalShell>
      )}
    </div>
  );
}
