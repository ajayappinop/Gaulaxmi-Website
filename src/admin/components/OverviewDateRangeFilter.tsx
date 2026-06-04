import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import {
  DATE_FILTER_PRESET_OPTIONS,
  detectDateFilterPreset,
  filterForPreset,
  type DateFilterPreset,
  type TableDateFilter,
} from '../../lib/tableControls';
import { TableDateSortControls } from '../../components/TableDateSortControls';
import { TableFilterSelect } from '../../components/TableFilterSelect';
import { adminCard, adminTypography } from '../adminTheme';
import { tableFilterRowClass } from '../../components/tableFilterStyles';

const PRESET_SELECT_OPTIONS = [
  ...DATE_FILTER_PRESET_OPTIONS,
  { id: 'custom' as const, label: 'Custom range' },
];

export function OverviewDateRangeFilter({
  value,
  onChange,
}: {
  value: TableDateFilter;
  onChange: (filter: TableDateFilter) => void;
}) {
  const activePreset = useMemo(() => detectDateFilterPreset(value), [value]);

  const handlePresetChange = (id: string) => {
    if (id === 'custom') return;
    onChange(filterForPreset(id as Exclude<DateFilterPreset, 'custom'>));
  };

  return (
    <div className={`${adminCard} p-4 sm:p-5`}>
      <p className="flex flex-wrap items-center gap-2 text-sm text-stone-600 mb-4">
        <Calendar className="w-4 h-4 text-[#7f4e1c] shrink-0" />
        <span className="font-semibold text-stone-800">Overview date range</span>
        <span className="text-stone-500 text-xs sm:text-sm">
          Filters KPI totals and analytics below
        </span>
      </p>

      <div className={`${tableFilterRowClass} mb-3`}>
        <TableFilterSelect
          label="Quick range"
          value={activePreset}
          options={PRESET_SELECT_OPTIONS}
          onChange={handlePresetChange}
          minWidth="min-w-[11rem]"
        />
      </div>

      <p className={`${adminTypography.meta} mb-2`}>
        {activePreset === 'custom'
          ? 'Custom range — set exact From and To dates below'
          : 'Use Custom range in the dropdown, or adjust dates below for a specific period'}
      </p>

      <TableDateSortControls
        dateFilter={value}
        onDateFilterChange={onChange}
        sortOrder="desc"
        onSortOrderChange={() => {}}
        variant="admin"
        showSort={false}
      />
    </div>
  );
}
