import React from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type { AdminTableFilter } from '../hooks/useAdminTable';

export function AdminTableToolbar({
  searchInput,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters,
  filter,
  onFilterChange,
  total,
  page,
  totalPages,
  onPageChange,
  loading,
}: {
  searchInput: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: AdminTableFilter[];
  filter?: string;
  onFilterChange?: (id: string) => void;
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-stone-900 shadow-sm outline-none focus:border-[#7f4e1c]/50 focus:ring-2 focus:ring-[#7f4e1c]/10 transition"
          />
        </div>
        {filters && filters.length > 0 && onFilterChange && filter !== undefined && (
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onFilterChange(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition shadow-sm ${
                  filter === f.id
                    ? 'bg-[#7f4e1c] border-[#7f4e1c] text-white'
                    : 'bg-white border-stone-200 text-stone-600 hover:border-[#d8cec1] hover:text-[#7f4e1c]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 text-sm">
        <span className="text-stone-500 font-medium">
          {loading ? (
            'Loading…'
          ) : (
            <>
              <span className="font-semibold text-stone-800">{total}</span>
              {' '}
              result{total === 1 ? '' : 's'}
            </>
          )}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 mr-1 hidden sm:inline">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => onPageChange(page - 1)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-600 font-semibold hover:bg-stone-50 hover:border-stone-300 disabled:opacity-40 disabled:pointer-events-none transition"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span className="sm:hidden text-stone-500 px-1">
              {page}/{totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => onPageChange(page + 1)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-600 font-semibold hover:bg-stone-50 hover:border-stone-300 disabled:opacity-40 disabled:pointer-events-none transition"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
