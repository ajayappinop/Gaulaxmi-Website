import React from 'react';
import { Eye } from 'lucide-react';
import { AdminActionLink } from './AdminDataTable';

export function AdminDetailsButton({ onClick }: { onClick: () => void }) {
  return (
    <AdminActionLink variant="neutral" onClick={onClick}>
      <Eye className="w-3.5 h-3.5" />
      Details
    </AdminActionLink>
  );
}
