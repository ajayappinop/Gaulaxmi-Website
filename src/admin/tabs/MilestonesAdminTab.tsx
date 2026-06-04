import React, { useEffect, useMemo, useState } from 'react';
import { Award, Pencil, Save, X } from 'lucide-react';
import type { User } from '../../lib/auth';
import { formatINR } from '../../lib/plans';
import {
  buildUserMilestoneRows,
  getUserTotalInvested,
  saveMilestones,
  type MilestoneTier,
  type UserMilestoneRow,
} from '../../lib/milestones';
import { getMemberAccounts } from '../../lib/adminStats';
import { toast } from 'react-hot-toast';
import { AdminTableToolbar } from '../components/AdminTableToolbar';
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
} from '../components/AdminDataTable';
import { useAdminTable } from '../hooks/useAdminTable';
import { adminTableControlProps } from '../components/AdminTableToolbar';
import { memberLatestActivityDate } from '../../lib/tableControls';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { adminTypography } from '../adminTheme';

export function MilestonesAdminTab({
  users,
  milestones: milestonesFromApi,
  onSetFulfillment,
  onRefresh,
  onViewMember,
}: {
  users: User[];
  milestones: MilestoneTier[];
  onSetFulfillment: (
    userId: string,
    milestoneId: string,
    status: 'eligible' | 'fulfilled' | null
  ) => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
  onViewMember: (userId: string) => void;
}) {
  const [tiers, setTiers] = useState<MilestoneTier[]>(milestonesFromApi);

  useEffect(() => {
    setTiers(milestonesFromApi);
  }, [milestonesFromApi]);
  const [editTier, setEditTier] = useState<MilestoneTier | null>(null);
  const [tierForm, setTierForm] = useState({ label: '', minInvest: '', cows: '', bonus: '' });
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const members = useMemo(() => getMemberAccounts(users), [users]);
  const rows = useMemo(() => buildUserMilestoneRows(members), [members, tiers]);

  const table = useAdminTable<UserMilestoneRow>({
    items: rows,
    searchFn: (row, q) =>
      row.user.name.toLowerCase().includes(q) ||
      row.user.email.toLowerCase().includes(q) ||
      row.user.id.toLowerCase().includes(q),
    filterFn: (row, f) => {
      if (f === 'invested') return row.totalInvested > 0;
      if (f === 'no_invest') return row.totalInvested === 0;
      if (f === 'eligible') return row.allQualified.length > 0;
      if (f === 'fulfilled') {
        return tiers.some(
          (t) => row.user.milestoneFulfillment?.[t.id] === 'fulfilled'
        );
      }
      return true;
    },
    getSortValue: (row) => row.totalInvested,
    getItemDate: (row) => memberLatestActivityDate(row.user),
  });

  const refreshTiers = () => setTiers(milestonesFromApi);

  const saveTierEdit = async () => {
    if (!editTier) return;
    const minInvest = Number(tierForm.minInvest);
    if (!tierForm.label.trim() || !Number.isFinite(minInvest) || minInvest < 0) {
      toast.error('Invalid milestone tier fields');
      return;
    }
    const updated = tiers.map((t) =>
      t.id === editTier.id
        ? {
            ...t,
            label: tierForm.label.trim(),
            minInvest: Math.round(minInvest),
            cows: tierForm.cows.trim() || t.cows,
            bonus: tierForm.bonus.trim() || t.bonus,
          }
        : t
    );
    try {
      await saveMilestones(updated);
      refreshTiers();
      setEditTier(null);
      await onRefresh();
      toast.success('Milestone tier updated');
    } catch {
      toast.error('Could not save milestone');
    }
  };

  const startEditTier = (t: MilestoneTier) => {
    setEditTier(t);
    setTierForm({
      label: t.label,
      minInvest: String(t.minInvest),
      cows: t.cows,
      bonus: t.bonus,
    });
  };

  const statusFor = (user: User, milestoneId: string, qualified: boolean) => {
    const stored = user.milestoneFulfillment?.[milestoneId];
    if (stored === 'fulfilled') return 'fulfilled' as const;
    if (stored === 'eligible' || qualified) return 'eligible' as const;
    return 'not_eligible' as const;
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Gir cow milestones"
        subtitle="Milestone tiers, member eligibility by total invested, and fulfillment tracking for physical cow rewards."
        icon={Award}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tiers.map((t, i) => {
          const tierStyles = [
            'from-[#f8f1e8] to-white border-[#d8cec1]',
            'from-amber-50 to-white border-amber-200',
            'from-emerald-50 to-white border-emerald-200',
            'from-violet-50 to-white border-violet-200',
          ];
          const accent = ['text-[#7f4e1c]', 'text-amber-800', 'text-emerald-800', 'text-violet-800'];
          const style = tierStyles[i % tierStyles.length];
          const color = accent[i % accent.length];
          return (
          <div
            key={t.id}
            className={`relative rounded-2xl p-4 border bg-gradient-to-br shadow-sm ${style}`}
          >
            <button
              type="button"
              onClick={() => startEditTier(t)}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/80 text-stone-500 hover:text-[#7f4e1c] border border-stone-200/80"
              title="Edit tier"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <p className={`text-xs uppercase font-bold tracking-wide ${color}`}>{t.label}</p>
            <p className="text-lg font-display font-bold text-stone-900 mt-1">{t.cows}</p>
            <p className="text-xs text-stone-600 mt-2">Min. {formatINR(t.minInvest)} invested</p>
            <p className="text-xs text-stone-500 mt-1">{t.bonus}</p>
            {t.tenureYears && (
              <p className="text-xs text-stone-600 mt-2">{t.tenureYears}-year lockup</p>
            )}
          </div>
          );
        })}
      </div>

      {editTier && (
        <div className="bg-white border border-amber-200 rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-stone-900">Edit milestone: {editTier.id}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              value={tierForm.label}
              onChange={(e) => setTierForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="Label"
              className="bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-900"
            />
            <input
              type="number"
              value={tierForm.minInvest}
              onChange={(e) => setTierForm((f) => ({ ...f, minInvest: e.target.value }))}
              placeholder="Min invest"
              className="bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-900"
            />
            <input
              value={tierForm.cows}
              onChange={(e) => setTierForm((f) => ({ ...f, cows: e.target.value }))}
              placeholder="Cow reward"
              className="bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-900"
            />
            <input
              value={tierForm.bonus}
              onChange={(e) => setTierForm((f) => ({ ...f, bonus: e.target.value }))}
              placeholder="Bonus description"
              className="bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-900"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveTierEdit}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#7f4e1c] text-stone-900 text-sm font-semibold"
            >
              <Save className="w-4 h-4" /> Save tier
            </button>
            <button type="button" onClick={() => setEditTier(null)} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-stone-100 text-stone-600 text-sm">
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      <AdminTableCard
        title="Members & milestone status"
        subtitle="Based on sum of all plan purchases"
        toolbar={
          <AdminTableToolbar
            searchInput={table.searchInput}
            onSearchChange={table.setSearchInput}
            searchPlaceholder="Search member name, email…"
            filters={[
              { id: 'all', label: 'All' },
              { id: 'invested', label: 'Has investments' },
              { id: 'no_invest', label: 'No investments' },
              { id: 'eligible', label: 'Milestone eligible' },
              { id: 'fulfilled', label: 'Fulfilled' },
            ]}
            filter={table.filter}
            onFilterChange={table.setFilter}
            total={table.total}
            page={table.page}
            totalPages={table.totalPages}
            onPageChange={table.setPage}
            {...adminTableControlProps(table)}
          />
        }
      >
        <AdminTable minWidth="min-w-[800px]">
          <AdminThead>
            <tr>
              <AdminTh>Member</AdminTh>
              <AdminTh align="right">Total invested</AdminTh>
              <AdminTh>Highest tier</AdminTh>
              <AdminTh>Qualified tiers</AdminTh>
              <AdminTh align="right">Details</AdminTh>
            </tr>
          </AdminThead>
          <AdminTbody>
              {table.paginated.length === 0 ? (
                <AdminEmptyRow colSpan={5} message="No members match your filters." />
              ) : (
                table.paginated.map((row) => (
                  <React.Fragment key={row.user.id}>
                    <AdminTr>
                      <AdminTd>
                        <AdminMemberCell
                          name={row.user.name}
                          sub={row.user.email}
                          userId={row.user.id}
                          onViewMember={onViewMember}
                        />
                      </AdminTd>
                      <AdminTd align="right">
                        <AdminMoney amount={formatINR(row.totalInvested)} />
                      </AdminTd>
                      <AdminTd>
                        {row.highestTier ? (
                          <span className="text-sm text-stone-800">
                            {row.highestTier.label}
                            <span className="text-stone-500"> · {row.highestTier.cows}</span>
                          </span>
                        ) : (
                          <span className="text-stone-400">—</span>
                        )}
                      </AdminTd>
                      <AdminTd className="text-xs">
                        {row.allQualified.length ? (
                          <span className="text-stone-600">{row.allQualified.map((m) => m.label).join(', ')}</span>
                        ) : (
                          <span className="text-stone-400">None</span>
                        )}
                      </AdminTd>
                      <AdminTd align="right">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedUserId(expandedUserId === row.user.id ? null : row.user.id)
                          }
                          className="text-xs font-bold text-[#7f4e1c] px-3 py-1.5 rounded-lg border border-[#d8cec1] bg-[#f8f1e8] hover:bg-[#ede0cf] transition"
                        >
                          {expandedUserId === row.user.id ? 'Hide' : 'View'}
                        </button>
                      </AdminTd>
                    </AdminTr>
                    {expandedUserId === row.user.id && (
                      <AdminTr muted>
                        <AdminTd colSpan={5} className="!py-5">
                          <div className="space-y-3">
                            <p className="text-xs text-stone-500">
                              Investments: {(row.user.investments || []).length} · Wallet{' '}
                              {formatINR(row.user.balance)}
                            </p>
                            <div className="grid sm:grid-cols-2 gap-2">
                              {tiers.map((m) => {
                                const qualified = getUserTotalInvested(row.user) >= m.minInvest;
                                const status = statusFor(row.user, m.id, qualified);
                                return (
                                  <div
                                    key={m.id}
                                    className="flex flex-wrap items-center justify-between gap-2 bg-white border border-stone-200 rounded-lg px-3 py-2"
                                  >
                                    <div>
                                      <span className="text-stone-900 text-xs font-semibold">{m.label}</span>
                                      <span className="text-stone-500 text-xs block">{m.cows}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`text-xs uppercase font-bold px-2 py-0.5 rounded-full ${
                                          status === 'fulfilled'
                                            ? 'bg-green-500/20 text-green-400'
                                            : status === 'eligible'
                                            ? 'bg-[#f8f1e8] text-[#9a5f23]'
                                            : 'bg-stone-100 text-stone-500'
                                        }`}
                                      >
                                        {status === 'fulfilled'
                                          ? 'fulfilled'
                                          : status === 'eligible'
                                          ? 'eligible'
                                          : 'not eligible'}
                                      </span>
                                      {qualified && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              void (async () => {
                                                await onSetFulfillment(row.user.id, m.id, 'fulfilled');
                                                await onRefresh();
                                                toast.success('Marked fulfilled');
                                              })();
                                            }}
                                            className="text-xs px-2 py-1 rounded bg-green-700/80 text-white font-semibold"
                                          >
                                            Fulfilled
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              void (async () => {
                                                await onSetFulfillment(row.user.id, m.id, null);
                                                await onRefresh();
                                              })();
                                            }}
                                            className="text-xs px-2 py-1 rounded bg-stone-200 text-stone-600"
                                          >
                                            Reset
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </AdminTd>
                      </AdminTr>
                    )}
                  </React.Fragment>
                ))
              )}
          </AdminTbody>
        </AdminTable>
      </AdminTableCard>
    </div>
  );
}
