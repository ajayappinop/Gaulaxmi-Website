import React from 'react';
import { AlertTriangle, UserCheck, UserX, X } from 'lucide-react';
import { adminTypography } from '../adminTheme';

export type AdminConfirmVariant = 'warning' | 'danger' | 'success';

const variantStyles: Record<
  AdminConfirmVariant,
  { iconBg: string; iconColor: string; confirmBtn: string }
> = {
  warning: {
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  danger: {
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    confirmBtn: 'bg-red-600 hover:bg-red-700 text-white',
  },
  success: {
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
    confirmBtn: 'bg-green-700 hover:bg-green-800 text-white',
  },
};

export function AdminConfirmDialog({
  open,
  title,
  description,
  details,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant = 'warning',
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  details?: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: AdminConfirmVariant;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  const v = variantStyles[variant];
  const Icon =
    variant === 'danger' ? AlertTriangle : variant === 'success' ? UserCheck : UserX;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        className="relative w-full max-w-md bg-white border border-stone-200 rounded-2xl shadow-xl p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition disabled:opacity-50"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${v.iconBg}`}
          >
            <Icon className={`w-5 h-5 ${v.iconColor}`} strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <h3 id="admin-confirm-title" className={adminTypography.sectionTitle}>
              {title}
            </h3>
            <p className={`${adminTypography.meta} mt-1 leading-relaxed`}>{description}</p>
          </div>
        </div>

        {details && (
          <div className="mt-4 text-sm text-stone-600 bg-[#faf7f2] border border-[#e8dcc8] rounded-xl p-4 leading-relaxed">
            {details}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-700 text-sm font-semibold hover:bg-stone-50 transition disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${v.confirmBtn}`}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
