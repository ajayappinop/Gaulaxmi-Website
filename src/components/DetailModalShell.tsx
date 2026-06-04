import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function DetailModalShell({
  title,
  subtitle,
  onClose,
  children,
  footer,
  hideFooter = false,
  maxWidth = 'max-w-lg',
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Replaces the default full-width Close button */
  footer?: React.ReactNode;
  hideFooter?: boolean;
  maxWidth?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`bg-white rounded-2xl sm:rounded-3xl shadow-xl w-full ${maxWidth} max-h-[90vh] overflow-hidden flex flex-col font-sans`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
      >
        <div className="flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-stone-100">
          <div className="min-w-0">
            <p id="detail-modal-title" className="font-display font-bold text-lg text-stone-900">
              {title}
            </p>
            {subtitle && (
              <p className="text-xs text-stone-500 mt-0.5 font-mono break-all">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-stone-100 text-stone-500 shrink-0 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 sm:px-6 py-5 flex-1 min-h-0">{children}</div>
        {!hideFooter && (
          <div className="shrink-0 px-5 sm:px-6 py-4 border-t border-stone-100 bg-stone-50/60">
            {footer ?? (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-[#7f4e1c] text-white font-semibold hover:bg-[#633a11] transition cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
