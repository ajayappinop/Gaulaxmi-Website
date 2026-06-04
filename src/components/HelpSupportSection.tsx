import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ChevronDown,
  HelpCircle,
  LifeBuoy,
  MessageSquarePlus,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { SupportTicket, SupportTicketCategory } from '../../shared/types';
import { api } from '../lib/apiClient';
import { SUPPORT_CATEGORY_OPTIONS, SUPPORT_FAQ_ITEMS } from '../lib/supportFaq';
import { TableListToolbar } from './TableListToolbar';
import { TablePagination } from './TablePagination';
import { DetailsActionButton } from './DetailsActionButton';
import { DetailModalShell } from './DetailModalShell';
import { useTableList } from '../hooks/useTableList';

function ticketStatusUi(status: SupportTicket['status']) {
  if (status === 'resolved' || status === 'closed') {
    return {
      icon: <CheckCircle className="w-3 h-3 shrink-0" />,
      className: 'bg-emerald-50 text-emerald-800 border-emerald-100',
      label: status === 'closed' ? 'Closed' : 'Resolved',
    };
  }
  if (status === 'in_progress') {
    return {
      icon: <Clock className="w-3 h-3 shrink-0" />,
      className: 'bg-sky-50 text-sky-800 border-sky-100',
      label: 'In progress',
    };
  }
  return {
    icon: <Clock className="w-3 h-3 shrink-0" />,
    className: 'bg-amber-50 text-amber-800 border-amber-100',
    label: 'Open',
  };
}

function categoryLabel(cat: SupportTicketCategory) {
  return SUPPORT_CATEGORY_OPTIONS.find((o) => o.id === cat)?.label ?? cat;
}

export function HelpSupportSection() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(SUPPORT_FAQ_ITEMS[0]?.id ?? null);
  const [detailTicket, setDetailTicket] = useState<SupportTicket | null>(null);

  const [category, setCategory] = useState<SupportTicketCategory>('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await api.getMySupportTickets();
      setTickets(rows);
    } catch {
      toast.error('Could not load your support tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const list = useTableList<SupportTicket>({
    items: tickets,
    pageSize: 6,
    getItemDate: (t) => t.createdAt,
    searchFn: (t, q) => {
      const hay = `${t.id} ${t.subject} ${t.message} ${t.category} ${t.status} ${t.adminReply ?? ''}`.toLowerCase();
      return hay.includes(q);
    },
    filterFn: (t, f) => {
      if (f === 'open' || f === 'in_progress' || f === 'resolved' || f === 'closed') {
        return t.status === f;
      }
      return true;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const subj = subject.trim();
    const msg = message.trim();
    if (subj.length < 3) {
      toast.error('Subject must be at least 3 characters');
      return;
    }
    if (msg.length < 10) {
      toast.error('Please describe your issue in at least 10 characters');
      return;
    }
    setSubmitting(true);
    try {
      await api.createSupportTicket({ category, subject: subj, message: msg });
      toast.success('Support ticket submitted. Our team will respond soon.');
      setSubject('');
      setMessage('');
      setCategory('general');
      await loadTickets();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full h-10 bg-white border border-stone-200 rounded-lg px-3 text-sm text-stone-900 shadow-sm outline-none focus:border-[#7f4e1c]/50 focus:ring-2 focus:ring-[#7f4e1c]/10';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 sm:space-y-8"
    >
      <header className="space-y-1">
        <h2 className="font-display font-bold text-xl sm:text-2xl text-stone-900 flex items-center gap-2">
          <LifeBuoy className="w-6 h-6 sm:w-7 sm:h-7 text-[#7f4e1c] shrink-0" />
          Help & Support
        </h2>
        <p className="text-sm text-stone-500">
          Browse common questions or raise a ticket — our team will reply in your ticket history
        </p>
      </header>

      <section className="bg-white border border-[#eae0d5]/85 rounded-3xl shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-stone-100 bg-gradient-to-r from-white to-[#faf7f2]">
          <h3 className="font-bold text-lg text-stone-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#7f4e1c]" />
            Frequently asked questions
          </h3>
          <p className="text-xs text-stone-500 mt-1">Quick answers before you contact support</p>
        </div>
        <div className="divide-y divide-stone-100">
          {SUPPORT_FAQ_ITEMS.map((item) => {
            const isOpen = openFaq === item.id;
            return (
              <div key={item.id}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : item.id)}
                  className="w-full flex items-center justify-between gap-3 px-5 sm:px-6 py-4 text-left hover:bg-[#faf7f2]/60 transition cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-sm text-stone-800 pr-2">{item.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#7f4e1c] shrink-0 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-4 -mt-1 text-sm text-stone-600 leading-relaxed">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white border border-[#eae0d5]/85 rounded-3xl p-5 sm:p-6 shadow-sm">
        <h3 className="font-bold text-lg text-stone-900 flex items-center gap-2 mb-1">
          <MessageSquarePlus className="w-5 h-5 text-[#7f4e1c]" />
          Raise a support ticket
        </h3>
        <p className="text-xs text-stone-500 mb-5">
          Describe your issue — it is sent to our admin team for review and resolution
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-stone-400 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SupportTicketCategory)}
              className={inputClass}
            >
              {SUPPORT_CATEGORY_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-stone-400 mb-1.5">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={120}
              placeholder="Brief summary of your issue"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-stone-400 mb-1.5">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              rows={5}
              placeholder="Include dates, amounts, or transaction IDs if relevant…"
              className={`${inputClass} h-auto py-3 min-h-[120px] resize-y`}
              required
            />
            <p className="text-[10px] text-stone-400 mt-1">{message.length}/2000</p>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7f4e1c] text-white text-sm font-semibold hover:bg-[#633a11] disabled:opacity-60 cursor-pointer"
          >
            {submitting ? 'Submitting…' : 'Submit ticket'}
          </button>
        </form>
      </section>

      <section className="bg-white border border-[#eae0d5]/85 rounded-3xl shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-stone-100">
          <h3 className="font-bold text-lg text-stone-900">My tickets</h3>
          <p className="text-xs text-stone-500 mt-0.5">Track status and read admin replies</p>
        </div>

        {loading ? (
          <p className="px-6 py-10 text-sm text-stone-500 text-center">Loading tickets…</p>
        ) : tickets.length === 0 ? (
          <p className="px-6 py-10 text-sm text-stone-500 text-center">
            No tickets yet. Submit a request above if you need help.
          </p>
        ) : (
          <>
            <div className="px-4 sm:px-5 py-4 border-b border-stone-100 bg-stone-50/40">
              <TableListToolbar
                searchInput={list.searchInput}
                onSearchChange={list.setSearchInput}
                searchPlaceholder="Search tickets…"
                filters={[
                  { id: 'all', label: 'All' },
                  { id: 'open', label: 'Open' },
                  { id: 'in_progress', label: 'In progress' },
                  { id: 'resolved', label: 'Resolved' },
                  { id: 'closed', label: 'Closed' },
                ]}
                filter={list.filter}
                onFilterChange={list.setFilter}
                filterLabel="Status"
                dateFilter={list.dateFilter}
                onDateFilterChange={list.setDateFilter}
                sortOrder={list.sortOrder}
                onSortOrderChange={list.setSortOrder}
              />
            </div>

            {list.total === 0 ? (
              <p className="px-6 py-8 text-sm text-stone-500 text-center">No tickets match your filters.</p>
            ) : (
              <div className="divide-y divide-stone-100">
                {list.paginated.map((t) => {
                  const ui = ticketStatusUi(t.status);
                  return (
                    <article
                      key={t.id}
                      className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${ui.className}`}
                          >
                            {ui.icon}
                            {ui.label}
                          </span>
                          <span className="text-[10px] font-bold uppercase text-stone-400">
                            {categoryLabel(t.category)}
                          </span>
                        </div>
                        <p className="font-semibold text-stone-900 truncate">{t.subject}</p>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {new Date(t.createdAt).toLocaleString('en-IN')}
                          {t.adminReply ? ' · Admin replied' : ''}
                        </p>
                      </div>
                      <DetailsActionButton onClick={() => setDetailTicket(t)} />
                    </article>
                  );
                })}
              </div>
            )}

            <div className="px-4 sm:px-5 py-4 border-t border-stone-100">
              <TablePagination
                currentPage={list.page}
                totalPages={list.totalPages}
                onPageChange={list.setPage}
                totalItems={list.total}
                itemsPerPage={list.pageSize}
                label="tickets"
              />
            </div>
          </>
        )}
      </section>

      {detailTicket && (
        <DetailModalShell
          title={detailTicket.subject}
          subtitle={`${categoryLabel(detailTicket.category)} · ${detailTicket.id}`}
          onClose={() => setDetailTicket(null)}
          maxWidth="max-w-xl"
        >
          <div className="px-5 sm:px-6 py-4 space-y-4 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {(() => {
                const ui = ticketStatusUi(detailTicket.status);
                return (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${ui.className}`}
                  >
                    {ui.icon}
                    {ui.label}
                  </span>
                );
              })()}
              <span className="text-xs text-stone-500 self-center">
                Submitted {new Date(detailTicket.createdAt).toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-stone-400 mb-1">Your message</p>
              <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">
                {detailTicket.message}
              </p>
            </div>
            {detailTicket.adminReply ? (
              <div className="rounded-xl bg-[#f8f1e8] border border-[#d8cec1] px-4 py-3">
                <p className="text-[10px] font-bold uppercase text-[#7f4e1c] mb-1">Support team reply</p>
                <p className="text-sm text-stone-800 whitespace-pre-wrap leading-relaxed">
                  {detailTicket.adminReply}
                </p>
                {detailTicket.repliedAt && (
                  <p className="text-xs text-stone-500 mt-2">
                    {new Date(detailTicket.repliedAt).toLocaleString('en-IN')}
                    {detailTicket.repliedBy ? ` · ${detailTicket.repliedBy}` : ''}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-stone-500 bg-stone-50 border border-stone-100 rounded-xl px-4 py-3">
                Waiting for admin response. You will see the reply here once your ticket is handled.
              </p>
            )}
          </div>
        </DetailModalShell>
      )}
    </motion.div>
  );
}
