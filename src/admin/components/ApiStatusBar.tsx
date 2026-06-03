import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { AdminMetricChip } from './AdminStatCard';

const ENDPOINTS = [
  'GET /api/admin/users',
  'GET /api/admin/stats',
  'GET /api/admin/inquiries',
  'PUT /api/admin/plans',
  'PUT /api/admin/milestones',
  'PATCH KYC / withdrawals / balance',
  'POST /api/admin/investments/assign',
];

export function ApiStatusBar({
  connected,
  loading,
  planCount,
  milestoneCount,
  memberCount,
}: {
  connected: boolean;
  loading?: boolean;
  planCount: number;
  milestoneCount: number;
  memberCount: number;
}) {
  return (
    <div
      className={`mb-6 rounded-2xl border px-4 py-4 text-sm shadow-sm ${
        connected
          ? 'border-emerald-200/90 bg-gradient-to-r from-emerald-50 via-white to-green-50/80 text-emerald-900'
          : 'border-red-200 bg-gradient-to-r from-red-50 via-white to-rose-50/80 text-red-900'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 font-semibold">
          <span
            className={`flex items-center justify-center w-9 h-9 rounded-xl ${
              connected
                ? 'bg-emerald-500 text-white shadow-[0_4px_10px_rgba(16,185,129,0.35)]'
                : 'bg-red-500 text-white shadow-[0_4px_10px_rgba(239,68,68,0.35)]'
            }`}
          >
            {connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          </span>
          <span>
            {loading
              ? 'Syncing with API…'
              : connected
                ? 'Backend connected — live data'
                : 'Cannot reach API — run npm run dev:api (port 4000)'}
          </span>
        </div>
        {connected && (
          <div className="flex flex-wrap gap-2">
            <AdminMetricChip label="Members" value={memberCount} tone="brown" />
            <AdminMetricChip label="Plans" value={planCount} tone="gold" />
            <AdminMetricChip label="Milestones" value={milestoneCount} tone="violet" />
          </div>
        )}
      </div>
      {connected && (
        <p className="mt-3 text-xs text-emerald-800/80 leading-relaxed pl-[2.75rem]">
          Integrated: {ENDPOINTS.join(' · ')}
        </p>
      )}
    </div>
  );
}
