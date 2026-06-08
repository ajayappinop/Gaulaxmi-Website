import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import {
  DATE_FILTER_PRESET_OPTIONS,
  detectDateFilterPreset,
  filterForPreset,
  getDateFilterLabel,
  type DateFilterPreset,
  type TableDateFilter,
} from '../lib/tableControls';
import { TableDateSortControls } from './TableDateSortControls';
import { TableFilterSelect } from './TableFilterSelect';
import { tableFilterRowClass } from './tableFilterStyles';

const PRESET_SELECT_OPTIONS = [
  ...DATE_FILTER_PRESET_OPTIONS,
  { id: 'custom' as const, label: 'Custom range' },
];

export function MemberOverviewDateFilter({
  value,
  onChange,
}: {
  value: TableDateFilter;
  onChange: (filter: TableDateFilter) => void;
}) {
  const activePreset = useMemo(() => detectDateFilterPreset(value), [value]);
  const rangeLabel = getDateFilterLabel(value);

  const handlePresetChange = (id: string) => {
    if (id === 'custom') return;
    onChange(filterForPreset(id as Exclude<DateFilterPreset, 'custom'>));
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl sm:rounded-3xl p-4 shadow-sm">
      <p className="flex flex-wrap items-center gap-2 text-sm text-stone-600 mb-3">
        <Calendar className="w-4 h-4 text-[#7f4e1c] shrink-0" />
        <span className="font-semibold text-stone-800">Date range</span>
        <span className="text-stone-500 text-xs sm:text-sm">
          Showing KPIs for <span className="font-medium text-stone-700">{rangeLabel}</span>
        </span>
      </p>

      <div className={tableFilterRowClass}>
        <TableFilterSelect
          label="Period"
          value={activePreset}
          options={PRESET_SELECT_OPTIONS}
          onChange={handlePresetChange}
          minWidth="min-w-[11rem]"
        />

        <TableDateSortControls
          dateFilter={value}
          onDateFilterChange={onChange}
          sortOrder="desc"
          onSortOrderChange={() => {}}
          variant="member"
          showSort={false}
          className="flex-1 min-w-0"
        />
      </div>
    </div>
  );
}
