import React from 'react';
import { adminTypography } from '../adminTheme';

type Align = 'left' | 'right' | 'center';

const thAlign: Record<Align, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

const tdAlign: Record<Align, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

/** Card wrapper: optional title, toolbar strip, then table content */
export function AdminTableCard({
  title,
  subtitle,
  toolbar,
  children,
  className = '',
}: {
  title?: string;
  subtitle?: string;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-stone-200/90 rounded-2xl shadow-sm overflow-hidden ${className}`}
    >
      {(title || subtitle) && (
        <div className="px-5 py-4 border-b border-[#e8dcc8]/60 bg-gradient-to-r from-white via-white to-[#faf7f2]">
          {title && <h3 className={adminTypography.sectionTitle}>{title}</h3>}
          {subtitle && <p className={`${adminTypography.meta} mt-0.5`}>{subtitle}</p>}
        </div>
      )}
      {toolbar && (
        <div className="px-4 sm:px-5 py-4 border-b border-stone-100 bg-[#fcfaf7]/80">{toolbar}</div>
      )}
      {children}
    </div>
  );
}

export function AdminTableScroll({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`overflow-x-auto ${className}`}>{children}</div>;
}

export function AdminTable({
  children,
  minWidth,
  className = '',
}: {
  children: React.ReactNode;
  minWidth?: string;
  className?: string;
}) {
  return (
    <AdminTableScroll>
      <table
        className={`w-full text-sm border-collapse ${minWidth ?? ''} ${className}`.trim()}
      >
        {children}
      </table>
    </AdminTableScroll>
  );
}

export function AdminThead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-gradient-to-r from-[#faf7f2] to-[#f3ebe0] border-b border-[#e8dcc8]">
      {children}
    </thead>
  );
}

export function AdminTbody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-stone-100">{children}</tbody>;
}

export const AdminTr = React.forwardRef<
  HTMLTableRowElement,
  {
    children: React.ReactNode;
    onClick?: () => void;
    selected?: boolean;
    muted?: boolean;
    className?: string;
  }
>(function AdminTr({ children, onClick, selected, muted, className = '' }, ref) {
  const base =
    'transition-colors duration-150 ' +
    (muted
      ? 'bg-[#faf7f2]/60'
      : selected
        ? 'bg-[#f8f1e8] hover:bg-[#f3ead8]'
        : 'hover:bg-[#faf7f2]/70');
  const interactive = onClick ? ' cursor-pointer' : '';
  return (
    <tr
      ref={ref}
      onClick={onClick}
      className={`${base}${interactive} ${className}`.trim()}
    >
      {children}
    </tr>
  );
});

export function AdminTh({
  children,
  align = 'left',
  className = '',
}: {
  children: React.ReactNode;
  align?: Align;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={`px-4 sm:px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#8f5f3a] whitespace-nowrap ${thAlign[align]} ${className}`}
    >
      {children}
    </th>
  );
}

export function AdminTd({
  children,
  align = 'left',
  mono,
  accent,
  colSpan,
  className = '',
}: {
  children: React.ReactNode;
  align?: Align;
  mono?: boolean;
  accent?: boolean;
  colSpan?: number;
  className?: string;
}) {
  return (
    <td
      colSpan={colSpan}
      className={`px-4 sm:px-5 py-3 align-middle text-sm text-stone-700 ${tdAlign[align]} ${
        mono ? 'font-mono tabular-nums' : ''
      } ${accent ? 'font-semibold text-[#7f4e1c]' : ''} ${className}`}
    >
      {children}
    </td>
  );
}

export function AdminEmptyRow({
  colSpan,
  message = 'No results match your filters.',
}: {
  colSpan: number;
  message?: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-14 text-center">
        <p className="text-sm text-stone-500">{message}</p>
      </td>
    </tr>
  );
}

/** Name + email stack used in member columns */
export function AdminMemberCell({
  name,
  sub,
  monoSub,
}: {
  name: string;
  sub?: string;
  monoSub?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="text-sm font-semibold text-stone-900 truncate">{name}</div>
      {sub && (
        <div
          className={`text-xs text-stone-500 mt-0.5 truncate ${monoSub ? 'font-mono' : ''}`}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

export function AdminMoney({ amount }: { amount: string }) {
  return <span className="font-mono tabular-nums text-sm font-semibold text-[#7f4e1c]">{amount}</span>;
}

export function AdminBadge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const tones = {
    neutral: 'bg-stone-100 text-stone-700 border-stone-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-[#f8f1e8] text-[#7f4e1c] border-[#d8cec1]',
  };
  return (
    <span
      className={`inline-flex items-center text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function kycBadgeTone(
  status?: string
): 'neutral' | 'success' | 'warning' | 'danger' {
  if (status === 'verified') return 'success';
  if (status === 'submitted') return 'warning';
  if (status === 'rejected') return 'danger';
  return 'neutral';
}

export function AdminIconActions({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-end gap-0.5">{children}</div>;
}

export function AdminIconButton({
  onClick,
  label,
  children,
  variant = 'default',
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  variant?: 'default' | 'danger';
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      title={label}
      className={`p-2 rounded-lg transition-colors ${
        variant === 'danger'
          ? 'text-stone-400 hover:text-red-600 hover:bg-red-50'
          : 'text-stone-400 hover:text-[#7f4e1c] hover:bg-[#f8f1e8]'
      }`}
    >
      {children}
    </button>
  );
}

export function AdminRowActions({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center justify-end gap-2">{children}</div>;
}

export function AdminActionLink({
  onClick,
  children,
  variant = 'approve',
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'approve' | 'reject' | 'neutral';
}) {
  const styles = {
    approve:
      'text-green-700 bg-green-50 border-green-200 hover:bg-green-100',
    reject: 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100',
    neutral:
      'text-[#7f4e1c] bg-[#f8f1e8] border-[#d8cec1] hover:bg-[#ede0cf]',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${styles[variant]}`}
    >
      {children}
    </button>
  );
}
