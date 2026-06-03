import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { adminTypography } from '../adminTheme';

export type AdminStatTone =
  | 'brown'
  | 'amber'
  | 'rose'
  | 'emerald'
  | 'gold'
  | 'sky'
  | 'violet';

const tones: Record<
  AdminStatTone,
  {
    card: string;
    iconWrap: string;
    icon: string;
    label: string;
    value: string;
    ring: string;
    badge?: string;
  }
> = {
  brown: {
    card: 'bg-gradient-to-br from-[#faf6f0] via-white to-[#f5ebe0] border-[#e8dcc8]',
    iconWrap: 'bg-[#7f4e1c] shadow-[0_4px_12px_rgba(127,78,28,0.25)]',
    icon: 'text-white',
    label: 'text-[#8f5f3a]',
    value: 'text-[#2e241b]',
    ring: 'hover:ring-[#7f4e1c]/25',
    badge: 'bg-[#f8f1e8] text-[#7f4e1c] border-[#d8cec1]',
  },
  amber: {
    card: 'bg-gradient-to-br from-amber-50 via-white to-orange-50/80 border-amber-200/80',
    iconWrap: 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-[0_4px_12px_rgba(245,158,11,0.35)]',
    icon: 'text-white',
    label: 'text-amber-800/80',
    value: 'text-amber-950',
    ring: 'hover:ring-amber-400/30',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  rose: {
    card: 'bg-gradient-to-br from-rose-50 via-white to-red-50/60 border-rose-200/80',
    iconWrap: 'bg-gradient-to-br from-rose-500 to-red-600 shadow-[0_4px_12px_rgba(244,63,94,0.3)]',
    icon: 'text-white',
    label: 'text-rose-800/80',
    value: 'text-rose-950',
    ring: 'hover:ring-rose-400/30',
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  emerald: {
    card: 'bg-gradient-to-br from-emerald-50 via-white to-green-50/70 border-emerald-200/80',
    iconWrap: 'bg-gradient-to-br from-emerald-600 to-green-700 shadow-[0_4px_12px_rgba(16,185,129,0.3)]',
    icon: 'text-white',
    label: 'text-emerald-800/80',
    value: 'text-emerald-950',
    ring: 'hover:ring-emerald-400/30',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  gold: {
    card: 'bg-gradient-to-br from-[#fff8eb] via-white to-[#f8f1e8] border-[#e8d4a8]',
    iconWrap: 'bg-gradient-to-br from-[#b8860b] to-[#7f4e1c] shadow-[0_4px_12px_rgba(184,134,11,0.35)]',
    icon: 'text-white',
    label: 'text-[#8f6b2a]',
    value: 'text-[#3d2a0a]',
    ring: 'hover:ring-[#d4a84b]/40',
    badge: 'bg-[#f2e2c9] text-[#7f4e1c] border-[#e8d4a8]',
  },
  sky: {
    card: 'bg-gradient-to-br from-sky-50 via-white to-blue-50/60 border-sky-200/80',
    iconWrap: 'bg-gradient-to-br from-sky-500 to-blue-600 shadow-[0_4px_12px_rgba(14,165,233,0.3)]',
    icon: 'text-white',
    label: 'text-sky-800/80',
    value: 'text-sky-950',
    ring: 'hover:ring-sky-400/30',
    badge: 'bg-sky-100 text-sky-800 border-sky-200',
  },
  violet: {
    card: 'bg-gradient-to-br from-violet-50 via-white to-purple-50/60 border-violet-200/80',
    iconWrap: 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-[0_4px_12px_rgba(139,92,246,0.3)]',
    icon: 'text-white',
    label: 'text-violet-800/80',
    value: 'text-violet-950',
    ring: 'hover:ring-violet-400/30',
    badge: 'bg-violet-100 text-violet-800 border-violet-200',
  },
};

export function AdminStatCard({
  label,
  value,
  icon: Icon,
  tone = 'brown',
  onClick,
  alert,
  alertLabel = 'Action needed',
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: AdminStatTone;
  onClick?: () => void;
  /** Show pulsing badge when numeric value > 0 */
  alert?: boolean;
  alertLabel?: string;
}) {
  const t = tones[tone];
  const Comp = onClick ? 'button' : 'div';

  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`relative text-left w-full rounded-2xl border p-5 shadow-sm transition-all duration-200 ${
        onClick ? `cursor-pointer hover:shadow-md hover:-translate-y-0.5 ring-2 ring-transparent ${t.ring}` : ''
      } ${t.card}`}
    >
      {alert && (
        <span
          className={`absolute top-3 right-3 text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${t.badge}`}
        >
          {alertLabel}
        </span>
      )}
      <div
        className={`inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4 ${t.iconWrap}`}
      >
        <Icon className={`w-5 h-5 ${t.icon}`} strokeWidth={2.25} />
      </div>
      <p className={`${adminTypography.kpiLabel} ${t.label}`}>{label}</p>
      <p className={`${adminTypography.kpiValue} mt-2 ${t.value}`}>
        {value}
      </p>
    </Comp>
  );
}

/** Small colored chip for status bars and inline metrics */
export function AdminMetricChip({
  label,
  value,
  tone = 'brown',
}: {
  label: string;
  value: string | number;
  tone?: AdminStatTone;
}) {
  const chipStyles: Record<AdminStatTone, string> = {
    brown: 'bg-[#f8f1e8] text-[#7f4e1c] border-[#d8cec1]',
    amber: 'bg-amber-50 text-amber-900 border-amber-200',
    rose: 'bg-rose-50 text-rose-900 border-rose-200',
    emerald: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    gold: 'bg-[#fff8eb] text-[#7f4e1c] border-[#e8d4a8]',
    sky: 'bg-sky-50 text-sky-900 border-sky-200',
    violet: 'bg-violet-50 text-violet-900 border-violet-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${chipStyles[tone]}`}
    >
      <span className="opacity-70">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </span>
  );
}
