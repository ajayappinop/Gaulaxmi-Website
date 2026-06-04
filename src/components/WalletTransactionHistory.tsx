import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Receipt,
  X,
} from 'lucide-react';
import type { Transaction } from '../lib/auth';
import { formatINR } from '../lib/plans';
import { useTableList } from '../hooks/useTableList';
import { TableListToolbar } from './TableListToolbar';
import { TablePagination } from './TablePagination';
import { DetailsActionButton } from './DetailsActionButton';

const TX_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'deposit', label: 'Deposits' },
  { id: 'withdrawal', label: 'Withdrawals' },
  { id: 'pending', label: 'Pending' },
  { id: 'completed', label: 'Completed' },
  { id: 'rejected', label: 'Rejected' },
];

function statusBadge(tx: Transaction) {
  const base = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border';
  if (tx.status === 'completed') {
    return (
      <span className={`${base} bg-emerald-50 text-emerald-700 border-emerald-100`}>
        <CheckCircle className="w-3 h-3 shrink-0" />
        <span className="capitalize">{tx.status}</span>
      </span>
    );
  }
  if (tx.status === 'rejected') {
    return (
      <span className={`${base} bg-red-50 text-red-700 border-red-100`}>
        <X className="w-3 h-3 shrink-0" />
        <span className="capitalize">{tx.status}</span>
      </span>
    );
  }
  return (
    <span className={`${base} bg-amber-50 text-amber-800 border-amber-100`}>
      <Clock className="w-3 h-3 shrink-0" />
      <span className="capitalize">{tx.status}</span>
    </span>
  );
}

function typeBadge(tx: Transaction) {
  const isDeposit = tx.type === 'deposit';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
        isDeposit ? 'bg-emerald-50 text-emerald-800' : 'bg-orange-50 text-orange-800'
      }`}
    >
      {isDeposit ? (
        <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
      ) : (
        <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
      )}
      <span className="capitalize">{tx.type}</span>
    </span>
  );
}

function formatTxDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  };
}

function SummaryStat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#eae0d5]/85 bg-white p-4 shadow-sm min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">{label}</p>
      <p className={`font-display font-bold text-lg mt-1 truncate ${accent ?? 'text-stone-900'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-stone-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export function WalletTransactionHistory({
  transactions,
  onViewDetails,
}: {
  transactions: Transaction[];
  onViewDetails: (tx: Transaction) => void;
}) {
  const list = useTableList<Transaction>({
    items: transactions,
    pageSize: 8,
    getItemDate: (tx) => tx.date,
    searchFn: (tx, q) => {
      const hay = `${tx.id} ${tx.type} ${tx.status} ${tx.details ?? ''}`.toLowerCase();
      return hay.includes(q);
    },
    filterFn: (tx, f) => {
      if (f === 'deposit' || f === 'withdrawal') return tx.type === f;
      if (f === 'completed' || f === 'pending' || f === 'rejected') return tx.status === f;
      return true;
    },
  });

  const summary = useMemo(() => {
    const rows = list.filtered;
    const sum = (type: Transaction['type'], status?: Transaction['status']) =>
      rows
        .filter((t) => t.type === type && (status ? t.status === status : true))
        .reduce((s, t) => s + t.amount, 0);
    return {
      count: rows.length,
      deposits: sum('deposit'),
      withdrawals: sum('withdrawal'),
      pending: rows.filter((t) => t.status === 'pending').length,
    };
  }, [list.filtered]);

  const hasAny = transactions.length > 0;
  const hasResults = list.total > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 sm:space-y-6"
    >
      <header className="space-y-1">
        <h2 className="font-display font-bold text-xl sm:text-2xl text-stone-900 flex items-center gap-2">
          <Receipt className="w-6 h-6 sm:w-7 sm:h-7 text-[#7f4e1c] shrink-0" />
          Transaction History
        </h2>
        <p className="text-sm text-stone-500">Deposits and withdrawals — track status and amounts</p>
      </header>

      {!hasAny ? (
        <div className="bg-white border border-[#eae0d5]/85 border-dashed rounded-3xl p-10 text-center shadow-sm">
          <Receipt className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-bold text-lg text-stone-800 mb-2">No transactions yet</h3>
          <p className="text-sm text-stone-500 max-w-md mx-auto">
            Deposit or withdraw funds from your wallet tab. Activity will appear here with live
            status updates.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <SummaryStat label="In view" value={String(summary.count)} sub="Matching filters" />
            <SummaryStat
              label="Deposits"
              value={formatINR(summary.deposits)}
              accent="text-emerald-700"
            />
            <SummaryStat
              label="Withdrawals"
              value={formatINR(summary.withdrawals)}
              accent="text-[#7b3f08]"
            />
            <SummaryStat
              label="Pending"
              value={String(summary.pending)}
              sub="Awaiting review"
              accent={summary.pending > 0 ? 'text-amber-700' : undefined}
            />
          </div>

          <div className="bg-white border border-[#eae0d5]/85 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-stone-100 bg-stone-50/40">
              <TableListToolbar
                searchInput={list.searchInput}
                onSearchChange={list.setSearchInput}
                searchPlaceholder="Search ID, type, status, details…"
                filters={TX_FILTERS}
                filter={list.filter}
                onFilterChange={list.setFilter}
                filterLabel="Type / status"
                dateFilter={list.dateFilter}
                onDateFilterChange={list.setDateFilter}
                sortOrder={list.sortOrder}
                onSortOrderChange={list.setSortOrder}
              />
            </div>

            {!hasResults ? (
              <div className="px-6 py-12 text-center text-sm text-stone-500">
                No transactions match your filters. Try clearing the date range or changing the
                filter.
              </div>
            ) : (
              <>
                <div className="md:hidden divide-y divide-stone-100">
                  {list.paginated.map((tx) => {
                    const { date, time } = formatTxDate(tx.date);
                    const isDeposit = tx.type === 'deposit';
                    return (
                      <article key={tx.id} className="p-4 sm:p-5 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 space-y-1.5">
                            {typeBadge(tx)}
                            <p className="text-xs font-mono text-stone-400 truncate">{tx.id}</p>
                          </div>
                          <p
                            className={`font-display font-bold text-lg shrink-0 ${
                              isDeposit ? 'text-emerald-700' : 'text-[#7b3f08]'
                            }`}
                          >
                            {isDeposit ? '+' : '−'}
                            {formatINR(tx.amount)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-stone-800">{date}</p>
                            <p className="text-xs text-stone-500">{time}</p>
                          </div>
                          {statusBadge(tx)}
                        </div>
                        {tx.details && (
                          <p className="text-sm text-stone-600 leading-snug line-clamp-2">
                            {tx.details}
                          </p>
                        )}
                        <div className="pt-1 flex justify-end">
                          <DetailsActionButton onClick={() => onViewDetails(tx)} />
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm text-left">
                    <thead>
                      <tr className="bg-stone-50/80 border-b border-stone-100 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        <th className="px-5 py-3 font-semibold">Date</th>
                        <th className="px-4 py-3 font-semibold">Type</th>
                        <th className="px-4 py-3 font-semibold min-w-[140px]">Details</th>
                        <th className="px-4 py-3 font-semibold text-right">Amount</th>
                        <th className="px-4 py-3 font-semibold text-center">Status</th>
                        <th className="px-5 py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {list.paginated.map((tx) => {
                        const { date, time } = formatTxDate(tx.date);
                        const isDeposit = tx.type === 'deposit';
                        return (
                          <tr
                            key={tx.id}
                            className="hover:bg-[#faf7f2]/80 transition-colors"
                          >
                            <td className="px-5 py-4 whitespace-nowrap">
                              <p className="font-medium text-stone-800">{date}</p>
                              <p className="text-xs text-stone-500 mt-0.5">{time}</p>
                            </td>
                            <td className="px-4 py-4">{typeBadge(tx)}</td>
                            <td className="px-4 py-4 text-stone-600 max-w-[220px]">
                              <p className="truncate" title={tx.details || undefined}>
                                {tx.details || '—'}
                              </p>
                              <p className="text-[10px] font-mono text-stone-400 mt-1 truncate">
                                {tx.id}
                              </p>
                            </td>
                            <td
                              className={`px-4 py-4 text-right font-display font-bold whitespace-nowrap ${
                                isDeposit ? 'text-emerald-700' : 'text-[#7b3f08]'
                              }`}
                            >
                              {isDeposit ? '+' : '−'}
                              {formatINR(tx.amount)}
                            </td>
                            <td className="px-4 py-4 text-center">{statusBadge(tx)}</td>
                            <td className="px-5 py-4 text-right">
                              <DetailsActionButton onClick={() => onViewDetails(tx)} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="px-4 sm:px-5 py-4 border-t border-stone-100 bg-stone-50/30">
                  <TablePagination
                    currentPage={list.page}
                    totalPages={list.totalPages}
                    onPageChange={list.setPage}
                    totalItems={list.total}
                    itemsPerPage={list.pageSize}
                    label="transactions"
                  />
                </div>
              </>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
