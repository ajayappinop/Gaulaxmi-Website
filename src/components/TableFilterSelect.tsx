import React from 'react';
import {
  tableFilterControlClass,
  tableFilterFieldClass,
  tableFilterLabelClass,
} from './tableFilterStyles';

export function TableFilterSelect({
  label,
  value,
  options,
  onChange,
  className = '',
  id,
  minWidth = 'min-w-[9rem]',
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
  className?: string;
  id?: string;
  minWidth?: string;
}) {
  const selectId = id ?? `filter-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className={`${tableFilterFieldClass} ${minWidth} ${className}`}>
      <label htmlFor={selectId} className={tableFilterLabelClass}>
        {label}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${tableFilterControlClass} w-full cursor-pointer ${minWidth}`}
      >
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
