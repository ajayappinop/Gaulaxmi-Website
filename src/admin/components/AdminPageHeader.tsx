import React from 'react';
import type { LucideIcon } from 'lucide-react';

export function AdminPageHeader({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
}) {
  return (
    <header className="space-y-1 mb-1">
      <h2 className="admin-page-title flex items-center gap-2.5">
        {Icon && <Icon className="w-6 h-6 text-[#7f4e1c] shrink-0" strokeWidth={2} />}
        {title}
      </h2>
      {subtitle && <p className="admin-page-desc">{subtitle}</p>}
    </header>
  );
}
