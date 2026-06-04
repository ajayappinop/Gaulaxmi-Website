import type { User } from './auth';

export type TableSortOrder = 'asc' | 'desc';

/** YYYY-MM-DD strings; empty = no bound on that side */
export type TableDateFilter = { from: string; to: string };

export const EMPTY_TABLE_DATE_FILTER: TableDateFilter = { from: '', to: '' };

export type DateFilterPreset = 'today' | '7d' | '30d' | 'all' | 'custom';

export const DATE_FILTER_PRESET_OPTIONS: { id: Exclude<DateFilterPreset, 'custom'>; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'all', label: 'All time' },
];

export const SORT_ORDER_OPTIONS: { id: TableSortOrder; label: string }[] = [
  { id: 'desc', label: 'Newest first' },
  { id: 'asc', label: 'Oldest first' },
];

export function toInputDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function filterForPreset(preset: Exclude<DateFilterPreset, 'custom'>): TableDateFilter {
  if (preset === 'all') return { ...EMPTY_TABLE_DATE_FILTER };

  const end = new Date();
  const start = new Date();

  if (preset === 'today') {
    start.setHours(0, 0, 0, 0);
    return { from: toInputDate(start), to: toInputDate(end) };
  }

  const days = preset === '7d' ? 7 : 30;
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  return { from: toInputDate(start), to: toInputDate(end) };
}

export function defaultLast30DaysFilter(): TableDateFilter {
  return filterForPreset('30d');
}

function sameDateFilter(a: TableDateFilter, b: TableDateFilter): boolean {
  return a.from === b.from && a.to === b.to;
}

export function detectDateFilterPreset(filter: TableDateFilter): DateFilterPreset {
  if (sameDateFilter(filter, filterForPreset('all'))) return 'all';
  if (sameDateFilter(filter, filterForPreset('today'))) return 'today';
  if (sameDateFilter(filter, filterForPreset('7d'))) return '7d';
  if (sameDateFilter(filter, filterForPreset('30d'))) return '30d';
  return 'custom';
}

export function hasActiveTableDateFilter(filter: TableDateFilter): boolean {
  return !!(filter.from?.trim() || filter.to?.trim());
}

export function parseDateInput(value: string, endOfDay: boolean): Date | null {
  const v = value?.trim();
  if (!v) return null;
  const d = new Date(`${v}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  if (endOfDay) d.setHours(23, 59, 59, 999);
  return d;
}

export function getCustomDateBounds(filter: TableDateFilter): {
  start: Date | null;
  end: Date | null;
} {
  const start = parseDateInput(filter.from, false);
  let end = parseDateInput(filter.to, true);
  if (!hasActiveTableDateFilter(filter)) {
    return { start: null, end: null };
  }
  if (!end) {
    end = new Date();
    end.setHours(23, 59, 59, 999);
  }
  return { start, end };
}

export function isDateInCustomRange(iso: string, filter: TableDateFilter): boolean {
  if (!hasActiveTableDateFilter(filter)) return true;
  const { start, end } = getCustomDateBounds(filter);
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  if (start && t < start.getTime()) return false;
  if (end && t > end.getTime()) return false;
  return true;
}

export function isDateInRange(iso: string, start: Date | null, end: Date | null): boolean {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  if (start && t < start.getTime()) return false;
  if (end && t > end.getTime()) return false;
  return true;
}

export function getDateFilterLabel(filter: TableDateFilter): string {
  const preset = detectDateFilterPreset(filter);
  if (preset !== 'custom') {
    return DATE_FILTER_PRESET_OPTIONS.find((o) => o.id === preset)?.label ?? 'All time';
  }
  if (!hasActiveTableDateFilter(filter)) return 'All time';
  const fmt = (s: string) =>
    new Date(`${s}T00:00:00`).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  if (filter.from && filter.to) return `${fmt(filter.from)} – ${fmt(filter.to)}`;
  if (filter.from) return `From ${fmt(filter.from)}`;
  return `Until ${fmt(filter.to)}`;
}

export function compareSortValues(
  a: number | string,
  b: number | string,
  order: TableSortOrder
): number {
  const cmp =
    typeof a === 'number' && typeof b === 'number'
      ? a - b
      : String(a).localeCompare(String(b), undefined, { numeric: true });
  return order === 'asc' ? cmp : -cmp;
}

export function memberLatestActivityDate(user: User): string | undefined {
  let latest = 0;
  for (const tx of user.transactions ?? []) {
    const t = new Date(tx.date).getTime();
    if (!Number.isNaN(t) && t > latest) latest = t;
  }
  for (const inv of user.investments ?? []) {
    const t = new Date(inv.date).getTime();
    if (!Number.isNaN(t) && t > latest) latest = t;
  }
  return latest > 0 ? new Date(latest).toISOString() : undefined;
}

export function memberHasActivityInRange(
  user: User,
  start: Date | null,
  end: Date | null
): boolean {
  if (!start && !end) return true;
  for (const tx of user.transactions ?? []) {
    if (isDateInRange(tx.date, start, end)) return true;
  }
  for (const inv of user.investments ?? []) {
    if (isDateInRange(inv.date, start, end)) return true;
  }
  return false;
}

export interface ApplyTablePipelineOptions<T> {
  items: T[];
  search?: string;
  searchFn?: (item: T, query: string) => boolean;
  filter?: string;
  filterFn?: (item: T, filter: string) => boolean;
  dateFilter?: TableDateFilter;
  getItemDate?: (item: T) => string | undefined;
  dateFilterFn?: (item: T, start: Date | null, end: Date | null) => boolean;
  sortOrder?: TableSortOrder;
  getSortValue?: (item: T) => number | string;
}

export function applyTablePipeline<T>({
  items,
  search = '',
  searchFn,
  filter = 'all',
  filterFn,
  dateFilter = EMPTY_TABLE_DATE_FILTER,
  getItemDate,
  dateFilterFn,
  sortOrder = 'desc',
  getSortValue,
}: ApplyTablePipelineOptions<T>): T[] {
  let list = items;

  if (filter !== 'all' && filterFn) {
    list = list.filter((item) => filterFn(item, filter));
  }

  if (search && searchFn) {
    const q = search.toLowerCase();
    list = list.filter((item) => searchFn(item, q));
  }

  if (hasActiveTableDateFilter(dateFilter) && (dateFilterFn || getItemDate)) {
    const { start, end } = getCustomDateBounds(dateFilter);
    list = list.filter((item) => {
      if (dateFilterFn) return dateFilterFn(item, start, end);
      const d = getItemDate?.(item);
      return d ? isDateInRange(d, start, end) : false;
    });
  }

  if (getSortValue || getItemDate) {
    list = [...list].sort((a, b) => {
      const resolve = (item: T): number | string => {
        if (getSortValue) return getSortValue(item);
        const d = getItemDate?.(item);
        return d ? new Date(d).getTime() : 0;
      };
      const va = resolve(a);
      const vb = resolve(b);
      return compareSortValues(va, vb, sortOrder);
    });
  }

  return list;
}
