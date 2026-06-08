import React, { useMemo } from 'react';
import { Users } from 'lucide-react';
import type { User } from '../../lib/auth';
import { formatINR } from '../../lib/plans';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminTableToolbar } from '../components/AdminTableToolbar';
import { AdminDetailsButton } from '../components/AdminDetailsButton';
import {
  AdminTable,
  AdminTableCard,
  AdminThead,
  AdminTbody,
  AdminTr,
  AdminTh,
  AdminTd,
  AdminEmptyRow,
  AdminMemberCell,
  AdminMoney,
  AdminBadge,
  kycBadgeTone,
} from '../components/AdminDataTable';
import { useAdminTable } from '../hooks/useAdminTable';
import { adminTableControlProps } from '../components/AdminTableToolbar';
import { memberHasActivityInRange, memberLatestActivityDate } from '../../lib/tableControls';
import { getNetworkQuickStats } from '../../lib/memberNetwork';

function countWalletTx(user: User, type: 'deposit' | 'withdrawal', status?: string) {
  return (user.transactions || []).filter(
    (t) => t.type === type && (status ? t.status === status : true)
  ).length;
}

export function UsersListTab({
  members,
  onViewMember,
}: {
  members: User[];
  onViewMember: (userId: string) => void;
}) {
  const networkStatsById = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getNetworkQuickStats>>();
    for (const m of members) {
      map.set(m.id, getNetworkQuickStats(m));
    }
    return map;
  }, [members]);

  const table = useAdminTable({
    items: members,
    searchFn: (m, q) =>
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q) ||
      (m.phone || '').includes(q) ||
      (m.walletAddress || '').toLowerCase().includes(q),
    filterFn: (m, f) => {
      if (f === 'active') return !m.isDeactivated;
      if (f === 'deactivated') return !!m.isDeactivated;
      if (f === 'kyc_submitted') return m.kycStatus === 'submitted';
      if (f === 'kyc_verified') return m.kycStatus === 'verified' || !!m.isKycVerified;
      if (f === 'kyc_rejected') return m.kycStatus === 'rejected';
      if (f === 'kyc_none') return !m.kycStatus || m.kycStatus === 'not_started';
      return true;
    },
    dateFilterFn: (m, start, end) => memberHasActivityInRange(m, start, end),
    getSortValue: (m) => memberLatestActivityDate(m) ?? m.name.toLowerCase(),
  });

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Users"
        subtitle="All member accounts — network size and referral income at a glance; open Details for the full profile"
        icon={Users}
      />
      <AdminTableToolbar
        searchInput={table.searchInput}
        onSearchChange={table.setSearchInput}
        searchPlaceholder="Search name, email, phone, wallet id…"
        filters={[
          { id: 'all', label: 'All' },
          { id: 'active', label: 'Active' },
          { id: 'deactivated', label: 'Deactivated' },
          { id: 'kyc_submitted', label: 'KYC pending' },
          { id: 'kyc_verified', label: 'KYC verified' },
          { id: 'kyc_rejected', label: 'KYC rejected' },
          { id: 'kyc_none', label: 'KYC not started' },
        ]}
        filter={table.filter}
        onFilterChange={table.setFilter}
        total={table.total}
        page={table.page}
        totalPages={table.totalPages}
        onPageChange={table.setPage}
        {...adminTableControlProps(table)}
      />
      <AdminTableCard>
        <AdminTable minWidth="min-w-[1120px]">
          <AdminThead>
            <tr>
              <AdminTh>Member</AdminTh>
              <AdminTh>Phone</AdminTh>
              <AdminTh>KYC</AdminTh>
              <AdminTh>Account</AdminTh>
              <AdminTh align="right">Direct refs</AdminTh>
              <AdminTh align="right">Network</AdminTh>
              <AdminTh align="right">Ref. income</AdminTh>
              <AdminTh align="right">Balance</AdminTh>
              <AdminTh align="right">Plans</AdminTh>
              <AdminTh align="right">Pending dep.</AdminTh>
              <AdminTh align="right">Pending w/d</AdminTh>
              <AdminTh align="right">Actions</AdminTh>
            </tr>
          </AdminThead>
          <AdminTbody>
            {table.paginated.length === 0 ? (
              <AdminEmptyRow colSpan={12} message="No members match your filters." />
            ) : (
              table.paginated.map((m) => {
                const net = networkStatsById.get(m.id);
                return (
                <AdminTr key={m.id}>
                  <AdminTd>
                    <AdminMemberCell
                      name={m.name}
                      sub={m.email}
                      userId={m.id}
                      onViewMember={onViewMember}
                    />
                    <span className="block text-[10px] font-mono text-stone-400 mt-0.5 truncate max-w-[200px]">
                      {m.id}
                    </span>
                  </AdminTd>
                  <AdminTd className="text-sm text-stone-600 whitespace-nowrap">
                    {m.phone || '—'}
                  </AdminTd>
                  <AdminTd>
                    <AdminBadge tone={kycBadgeTone(m.kycStatus)}>
                      {(m.kycStatus || 'not_started').replace(/_/g, ' ')}
                    </AdminBadge>
                  </AdminTd>
                  <AdminTd>
                    <AdminBadge tone={m.isDeactivated ? 'danger' : 'success'}>
                      {m.isDeactivated ? 'Deactivated' : 'Active'}
                    </AdminBadge>
                  </AdminTd>
                  <AdminTd align="right" className="text-stone-700 tabular-nums">
                    {net?.directCount ?? 0}
                  </AdminTd>
                  <AdminTd align="right" className="text-stone-700 tabular-nums">
                    {net?.totalNetworkSize ?? 0}
                    {(net?.indirectCount ?? 0) > 0 && (
                      <span className="block text-[10px] text-stone-400">
                        {net?.indirectCount} indirect
                      </span>
                    )}
                  </AdminTd>
                  <AdminTd align="right">
                    <AdminMoney amount={formatINR(net?.totalEarnings ?? 0)} />
                  </AdminTd>
                  <AdminTd align="right">
                    <AdminMoney amount={formatINR(m.balance)} />
                  </AdminTd>
                  <AdminTd align="right" className="text-stone-700 tabular-nums">
                    {m.investments?.length ?? 0}
                  </AdminTd>
                  <AdminTd align="right" className="text-stone-700 tabular-nums">
                    {countWalletTx(m, 'deposit', 'pending')}
                  </AdminTd>
                  <AdminTd align="right" className="text-stone-700 tabular-nums">
                    {countWalletTx(m, 'withdrawal', 'pending')}
                  </AdminTd>
                  <AdminTd align="right">
                    <AdminDetailsButton onClick={() => onViewMember(m.id)} />
                  </AdminTd>
                </AdminTr>
              );
              })
            )}
          </AdminTbody>
        </AdminTable>
      </AdminTableCard>
    </div>
  );
}
