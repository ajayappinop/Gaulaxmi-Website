import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function TablePagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  label = 'items',
  className = '',
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
  label?: string;
  className?: string;
}) {
  if (totalItems === 0) return null;

  const startIdx = (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, totalItems);

  const pageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [1];
    if (currentPage > 3) pages.push('ellipsis');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-2 border-t border-stone-100 text-xs font-sans ${className}`}
    >
      <div className="text-stone-500 font-medium">
        Showing <span className="font-semibold text-stone-800">{startIdx}</span> to{' '}
        <span className="font-semibold text-stone-800">{endIdx}</span> of{' '}
        <span className="font-semibold text-[#7f4e1c] font-mono">{totalItems}</span> {label}
        <span className="hidden sm:inline text-stone-400 ml-2">
          · Page {currentPage} of {totalPages}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-1 px-2.5 bg-white hover:bg-stone-50 border border-stone-200 hover:border-stone-300 disabled:opacity-40 disabled:hover:bg-white rounded-lg font-semibold transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed text-stone-600"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>

        {pageNumbers().map((page, idx) =>
          page === 'ellipsis' ? (
            <span key={`e-${idx}`} className="text-stone-400 px-1 select-none">
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg font-bold border transition cursor-pointer text-xs ${
                currentPage === page
                  ? 'bg-[#7f4e1c] text-white border-[#7f4e1c] shadow-sm'
                  : 'bg-white hover:bg-stone-50 border-stone-200 hover:border-stone-300 text-stone-600'
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-1 px-2.5 bg-white hover:bg-stone-50 border border-stone-200 hover:border-stone-300 disabled:opacity-40 disabled:hover:bg-white rounded-lg font-semibold transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed text-stone-600"
        >
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
