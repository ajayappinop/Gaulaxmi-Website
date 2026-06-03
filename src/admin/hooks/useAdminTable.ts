import { useEffect, useMemo, useState } from 'react';

export const DEFAULT_ADMIN_PAGE_SIZE = 10;

export interface AdminTableFilter {
  id: string;
  label: string;
}

export interface UseAdminTableOptions<T> {
  items: T[];
  pageSize?: number;
  initialFilter?: string;
  searchFn?: (item: T, query: string) => boolean;
  filterFn?: (item: T, filter: string) => boolean;
}

export function useAdminTable<T>({
  items,
  pageSize = DEFAULT_ADMIN_PAGE_SIZE,
  initialFilter = 'all',
  searchFn,
  filterFn,
}: UseAdminTableOptions<T>) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(initialFilter);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const filtered = useMemo(() => {
    let list = items;
    if (filter !== 'all' && filterFn) {
      list = list.filter((item) => filterFn(item, filter));
    }
    if (search && searchFn) {
      const q = search.toLowerCase();
      list = list.filter((item) => searchFn(item, q));
    }
    return list;
  }, [items, search, filter, filterFn, searchFn]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const setFilterAndReset = (next: string) => {
    setFilter(next);
    setPage(1);
  };

  return {
    searchInput,
    setSearchInput,
    filter,
    setFilter: setFilterAndReset,
    page: safePage,
    setPage,
    pageSize,
    filtered,
    paginated,
    total: filtered.length,
    totalPages,
  };
}
