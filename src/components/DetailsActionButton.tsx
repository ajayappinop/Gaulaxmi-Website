import React from 'react';
import { Eye } from 'lucide-react';

export function DetailsActionButton({
  onClick,
  label = 'Details',
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#7b4b1d] bg-[#f8f1e8] border border-[#d8cec1] hover:bg-[#ede0cf] transition cursor-pointer"
    >
      <Eye className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
