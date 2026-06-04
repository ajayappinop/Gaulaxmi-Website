import React from 'react';
import { Search } from 'lucide-react';
import type { AdminTableFilter } from '../admin/hooks/useAdminTable';
import { TableDateSortControls } from './TableDateSortControls';
import { TableFilterSelect } from './TableFilterSelect';
import {
  tableFilterControlClass,
  tableFilterFieldClass,
  tableFilterLabelClass,
  tableFilterRowClass,
} from './tableFilterStyles';
import type { TableDateFilter, TableSortOrder } from '../lib/tableControls';

export function TableListToolbar({
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
  showDateRange = true,
  showSort = true,
}: {
  searchInput?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: AdminTableFilter[];
  filter?: string;
  onFilterChange?: (id: string) => void;
  filterLabel?: string;
  dateFilter: TableDateFilter;
  onDateFilterChange: (filter: TableDateFilter) => void;
  sortOrder: TableSortOrder;
  onSortOrderChange: (order: TableSortOrder) => void;
  showDateRange?: boolean;
  showSort?: boolean;
}) {
  const hasSearch = searchInput !== undefined && onSearchChange !== undefined;
  const hasStatusDropdown =
    filters && filters.length > 0 && onFilterChange && filter !== undefined;
  const showControls = showDateRange || showSort;

  return (
    <div className="mb-4 space-y-3">
      <div className={tableFilterRowClass}>
        {hasSearch && (
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
        )}

        {hasStatusDropdown && !showControls && (
          <TableFilterSelect
            label={filterLabel}
            value={filter}
            options={filters}
            onChange={onFilterChange}
            minWidth="min-w-[10rem]"
          />
        )}
      </div>

      {showControls && (
        <TableDateSortControls
          dateFilter={dateFilter}
          onDateFilterChange={onDateFilterChange}
          sortOrder={sortOrder}
          onSortOrderChange={onSortOrderChange}
          variant="member"
          showDateRange={showDateRange}
          showSort={showSort}
          statusFilters={hasStatusDropdown ? filters : undefined}
          statusFilter={hasStatusDropdown ? filter : undefined}
          onStatusFilterChange={hasStatusDropdown ? onFilterChange : undefined}
          statusFilterLabel={filterLabel}
        />
      )}
    </div>
  );
}
