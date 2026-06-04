import { useEffect, useMemo, useState } from 'react';
import {
  applyTablePipeline,
  EMPTY_TABLE_DATE_FILTER,
  type TableDateFilter,
  type TableSortOrder,
} from '../lib/tableControls';

export const DEFAULT_TABLE_PAGE_SIZE = 10;

export interface UseTableListOptions<T> {
  items: T[];
  pageSize?: number;
  initialFilter?: string;
  initialDateFilter?: TableDateFilter;
  initialSortOrder?: TableSortOrder;
  searchFn?: (item: T, query: string) => boolean;
  filterFn?: (item: T, filter: string) => boolean;
  getItemDate?: (item: T) => string | undefined;
  dateFilterFn?: (item: T, start: Date | null, end: Date | null) => boolean;
  getSortValue?: (item: T) => number | string;
  debounceSearch?: boolean;
}

export function useTableList<T>({
  items,
  pageSize = DEFAULT_TABLE_PAGE_SIZE,
  initialFilter = 'all',
  initialDateFilter = EMPTY_TABLE_DATE_FILTER,
  initialSortOrder = 'desc',
  searchFn,
  filterFn,
  getItemDate,
  dateFilterFn,
  getSortValue,
  debounceSearch = false,
}: UseTableListOptions<T>) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(initialFilter);
  const [dateFilter, setDateFilter] = useState<TableDateFilter>(initialDateFilter);
  const [sortOrder, setSortOrder] = useState<TableSortOrder>(initialSortOrder);
  const [page, setPage] = useState(1);

  const showDateRange = !!(getItemDate || dateFilterFn);
  const showSort = !!(getSortValue || getItemDate);
  const showDateSort = showDateRange || showSort;

  useEffect(() => {
    if (!debounceSearch) {
      setSearch(searchInput.trim());
      return;
    }
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput, debounceSearch]);

  useEffect(() => {
    if (!debounceSearch) setPage(1);
  }, [search, filter, dateFilter, sortOrder, debounceSearch]);

  const filtered = useMemo(
    () =>
      applyTablePipeline({
        items,
        search: debounceSearch ? search : searchInput.trim(),
        searchFn,
        filter,
        filterFn,
        dateFilter,
        getItemDate,
        dateFilterFn,
        sortOrder,
        getSortValue,
      }),
    [
      items,
      search,
      searchInput,
      debounceSearch,
      filter,
      filterFn,
      searchFn,
      dateFilter,
      getItemDate,
      dateFilterFn,
      sortOrder,
      getSortValue,
    ]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const resetPage = () => setPage(1);

  const setFilterAndReset = (next: string) => {
    setFilter(next);
    setPage(1);
  };

  const setDateFilterAndReset = (next: TableDateFilter) => {
    setDateFilter(next);
    setPage(1);
  };

  const setSortOrderAndReset = (next: TableSortOrder) => {
    setSortOrder(next);
    setPage(1);
  };

  const setSearchInputAndReset = (value: string) => {
    setSearchInput(value);
    if (!debounceSearch) setPage(1);
  };

  return {
    searchInput,
    setSearchInput: setSearchInputAndReset,
    filter,
    setFilter: setFilterAndReset,
    dateFilter,
    setDateFilter: setDateFilterAndReset,
    sortOrder,
    setSortOrder: setSortOrderAndReset,
    showDateRange,
    showSort,
    showDateSort,
    page: safePage,
    setPage,
    resetPage,
    pageSize,
    filtered,
    paginated,
    total: filtered.length,
    totalPages,
  };
}
