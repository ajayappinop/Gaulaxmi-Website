import React from 'react';
import { Calendar, X } from 'lucide-react';
import {
  EMPTY_TABLE_DATE_FILTER,
  SORT_ORDER_OPTIONS,
  hasActiveTableDateFilter,
  type TableDateFilter,
  type TableSortOrder,
} from '../lib/tableControls';
import { TableFilterSelect } from './TableFilterSelect';
import {
  tableFilterControlClass,
  tableFilterFieldClass,
  tableFilterLabelClass,
  tableFilterRowClass,
} from './tableFilterStyles';

export function TableDateSortControls({
  dateFilter,
  onDateFilterChange,
  sortOrder,
  onSortOrderChange,
  variant = 'member',
  className = '',
  showDateRange = true,
  showSort = true,
  statusFilters,
  statusFilter,
  onStatusFilterChange,
  statusFilterLabel = 'Status',
}: {
  dateFilter: TableDateFilter;
  onDateFilterChange: (filter: TableDateFilter) => void;
  sortOrder: TableSortOrder;
  onSortOrderChange: (order: TableSortOrder) => void;
  variant?: 'admin' | 'member';
  className?: string;
  showDateRange?: boolean;
  showSort?: boolean;
  statusFilters?: { id: string; label: string }[];
  statusFilter?: string;
  onStatusFilterChange?: (id: string) => void;
  statusFilterLabel?: string;
}) {
  const accent = variant === 'admin' ? 'text-[#7f4e1c]' : 'text-[#7f4e1c]';

  const patchDate = (patch: Partial<TableDateFilter>) => {
    onDateFilterChange({ ...dateFilter, ...patch });
  };

  return (
    <div className={`${tableFilterRowClass} ${className}`}>
      {statusFilters && statusFilters.length > 0 && onStatusFilterChange && statusFilter !== undefined && (
        <TableFilterSelect
          label={statusFilterLabel}
          value={statusFilter}
          options={statusFilters}
          onChange={onStatusFilterChange}
          minWidth="min-w-[10rem]"
        />
      )}

      {showDateRange && (
        <div className={`${tableFilterFieldClass} min-w-0 flex-1 sm:flex-initial sm:min-w-[280px]`}>
          <span className={`${tableFilterLabelClass} inline-flex items-center gap-1`}>
            <Calendar className={`w-3 h-3 ${accent}`} />
            Date range
          </span>
          <div className="flex h-10 items-stretch gap-2">
            <input
              type="date"
              aria-label="From date"
              value={dateFilter.from}
              max={dateFilter.to || undefined}
              onChange={(e) => patchDate({ from: e.target.value })}
              className={`${tableFilterControlClass} flex-1 min-w-[8.5rem] max-w-[10.5rem]`}
            />
            <span
              className="flex items-center text-stone-400 text-sm shrink-0 select-none"
              aria-hidden
            >
              –
            </span>
            <input
              type="date"
              aria-label="To date"
              value={dateFilter.to}
              min={dateFilter.from || undefined}
              onChange={(e) => patchDate({ to: e.target.value })}
              className={`${tableFilterControlClass} flex-1 min-w-[8.5rem] max-w-[10.5rem]`}
            />
            {hasActiveTableDateFilter(dateFilter) && (
              <button
                type="button"
                onClick={() => onDateFilterChange(EMPTY_TABLE_DATE_FILTER)}
                className="inline-flex h-10 shrink-0 items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 text-xs font-semibold text-stone-600 shadow-sm hover:bg-stone-50 cursor-pointer"
                title="Clear date range"
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </div>
      )}

      {showSort && (
        <TableFilterSelect
          label="Sort"
          value={sortOrder}
          options={SORT_ORDER_OPTIONS}
          onChange={(id) => onSortOrderChange(id as TableSortOrder)}
          minWidth="min-w-[9.5rem]"
        />
      )}
    </div>
  );
}
