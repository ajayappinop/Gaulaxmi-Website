import React from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type { AdminTableFilter } from '../hooks/useAdminTable';
import { TableDateSortControls } from '../../components/TableDateSortControls';
import { TableFilterSelect } from '../../components/TableFilterSelect';
import {
  tableFilterControlClass,
  tableFilterFieldClass,
  tableFilterLabelClass,
  tableFilterRowClass,
} from '../../components/tableFilterStyles';
import type { TableDateFilter, TableSortOrder } from '../../lib/tableControls';

export function AdminTableToolbar({
  searchInput,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters,
  filter,
  onFilterChange,
  filterLabel = 'Filter',
  dateFilter,
  onDateFilterChange,
  sortOrder,
  onSortOrderChange,
  showDateSort = false,
  showDateRange = true,
  showSort = true,
  total,
  page,
  totalPages,
  onPageChange,
  loading,
  pageSize = 10,
}: {
  searchInput: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: AdminTableFilter[];
  filter?: string;
  onFilterChange?: (id: string) => void;
  filterLabel?: string;
  dateFilter?: TableDateFilter;
  onDateFilterChange?: (filter: TableDateFilter) => void;
  sortOrder?: TableSortOrder;
  onSortOrderChange?: (order: TableSortOrder) => void;
  showDateSort?: boolean;
  showDateRange?: boolean;
  showSort?: boolean;
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  pageSize?: number;
}) {
  const dateSortEnabled =
    showDateSort &&
    dateFilter !== undefined &&
    onDateFilterChange !== undefined &&
    sortOrder !== undefined &&
    onSortOrderChange !== undefined;

  const hasStatusDropdown =
    filters && filters.length > 0 && onFilterChange && filter !== undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className={tableFilterRowClass}>
          <div className={`${tableFilterFieldClass} w-full sm:flex-1 sm:min-w-[200px] sm:max-w-md`}>
            <span className={`${tableFilterLabelClass} invisible select-none`} aria-hidden>
              Search
            </span>
            <div className="relative h-10 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className={`${tableFilterControlClass} h-full w-full rounded-xl pl-10 pr-4`}
              />
            </div>
          </div>

          {hasStatusDropdown && !dateSortEnabled && (
            <TableFilterSelect
              label={filterLabel}
              value={filter}
              options={filters}
              onChange={onFilterChange}
              minWidth="min-w-[10rem]"
            />
          )}
        </div>

        {dateSortEnabled && (
          <TableDateSortControls
            dateFilter={dateFilter}
            onDateFilterChange={onDateFilterChange}
            sortOrder={sortOrder}
            onSortOrderChange={onSortOrderChange}
            variant="admin"
            showDateRange={showDateRange}
            showSort={showSort}
            statusFilters={hasStatusDropdown ? filters : undefined}
            statusFilter={hasStatusDropdown ? filter : undefined}
            onStatusFilterChange={hasStatusDropdown ? onFilterChange : undefined}
            statusFilterLabel={filterLabel}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 text-sm">
        <span className="text-stone-500 font-medium">
          {loading ? (
            'Loading…'
          ) : total > 0 ? (
            <>
              Showing{' '}
              <span className="font-semibold text-stone-800">
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}
              </span>{' '}
              of <span className="font-semibold text-stone-800">{total}</span> result
              {total === 1 ? '' : 's'}
            </>
          ) : (
            <>No results</>
          )}
        </span>
        {!loading && total > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 mr-1 hidden sm:inline">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => onPageChange(page - 1)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-600 font-semibold hover:bg-stone-50 hover:border-stone-300 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
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
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-600 font-semibold hover:bg-stone-50 hover:border-stone-300 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function adminTableControlProps(table: {
  dateFilter: TableDateFilter;
  setDateFilter: (filter: TableDateFilter) => void;
  sortOrder: TableSortOrder;
  setSortOrder: (order: TableSortOrder) => void;
  showDateSort: boolean;
  showDateRange?: boolean;
  showSort?: boolean;
}) {
  return {
    dateFilter: table.dateFilter,
    onDateFilterChange: table.setDateFilter,
    sortOrder: table.sortOrder,
    onSortOrderChange: table.setSortOrder,
    showDateSort: table.showDateSort,
    showDateRange: table.showDateRange ?? true,
    showSort: table.showSort ?? true,
  };
}
