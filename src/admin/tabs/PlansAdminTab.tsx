import React, { useEffect, useMemo, useState } from 'react';
import { Layers, Plus, Pencil, Trash2, Download, Upload } from 'lucide-react';
import type { User } from '../../lib/auth';
import { formatINR, type InvestmentPlan } from '../../lib/plans';
import {
  buildPlanFromInput,
  countPurchasesByPlan,
  deletePlanById,
  savePlans,
  upsertPlan,
} from '../../lib/planStore';
import { flattenInvestments } from '../../lib/adminStats';
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
  AdminBadge,
  AdminIconActions,
  AdminIconButton,
  AdminMoney,
} from '../components/AdminDataTable';
import { useAdminTable } from '../hooks/useAdminTable';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { adminTypography } from '../adminTheme';

export function PlansAdminTab({
  users,
  plans: plansFromApi,
  onRefresh,
}: {
  users: User[];
  plans: InvestmentPlan[];
  onRefresh: () => void | Promise<void>;
}) {
  const [plans, setPlans] = useState<InvestmentPlan[]>(plansFromApi);

  useEffect(() => {
    setPlans(plansFromApi);
  }, [plansFromApi]);
  const [editing, setEditing] = useState<InvestmentPlan | null>(null);
  const [form, setForm] = useState({ tier: '', amount: '', featured: false });

  const purchases = useMemo(() => flattenInvestments(users), [users]);

  const table = useAdminTable<InvestmentPlan>({
    items: plans,
    searchFn: (p, q) =>
      p.tier.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      String(p.amount).includes(q),
    filterFn: (p, f) => {
      if (f === 'featured') return !!p.featured;
      if (f === 'standard') return !p.featured;
      if (f === 'has_purchases') return countPurchasesByPlan(p.id, p.tier, purchases) > 0;
      return true;
    },
  });

  const refreshPlans = () => setPlans(plansFromApi);

  const resetForm = () => {
    setForm({ tier: '', amount: '', featured: false });
    setEditing(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!form.tier.trim() || !Number.isFinite(amount) || amount < 1000) {
      toast.error('Enter a valid tier name and amount (min ₹1,000).');
      return;
    }
    const plan = editing
      ? { ...buildPlanFromInput(form.tier, amount, { id: editing.id, featured: form.featured }), featured: form.featured }
      : buildPlanFromInput(form.tier, amount, { featured: form.featured });
    try {
      await upsertPlan(plan);
      refreshPlans();
      await onRefresh();
      resetForm();
      toast.success(editing ? 'Plan updated' : 'Plan created');
    } catch {
      toast.error('Could not save plan. Are you signed in as admin?');
    }
  };

  const startEdit = (plan: InvestmentPlan) => {
    setEditing(plan);
    setForm({ tier: plan.tier, amount: String(plan.amount), featured: !!plan.featured });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this plan? Existing purchases keep their recorded names.')) return;
    try {
      await deletePlanById(id);
      refreshPlans();
      toast.success('Plan removed');
    } catch {
      toast.error('Could not delete plan');
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(plans, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gaulaxmi_plans.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const parsed = JSON.parse(await file.text()) as InvestmentPlan[];
        if (!Array.isArray(parsed) || !parsed.length) throw new Error('empty');
        await savePlans(parsed);
        refreshPlans();
        await onRefresh();
        toast.success(`Imported ${parsed.length} plans`);
      } catch {
        toast.error('Invalid plans JSON file');
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <AdminPageHeader
          title="Investment plans"
          subtitle="Create and edit tiers shown on the member site and dashboard. Returns auto-calculate at 5% monthly for 60 months."
          icon={Layers}
        />
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-100 text-stone-600 text-sm font-semibold hover:bg-stone-200"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button
            type="button"
            onClick={handleImport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-100 text-stone-600 text-sm font-semibold hover:bg-stone-200"
          >
            <Upload className="w-3.5 h-3.5" /> Import
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-stone-900 flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#7f4e1c]" />
          {editing ? 'Edit plan' : 'Create new plan'}
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-stone-500 uppercase font-semibold">Tier name</label>
            <input
              value={form.tier}
              onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}
              className="mt-1 w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-900"
              placeholder="e.g. Silver"
              required
            />
          </div>
          <div>
            <label className="text-xs text-stone-500 uppercase font-semibold">Amount (₹)</label>
            <input
              type="number"
              min={1000}
              step={1000}
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="mt-1 w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-900"
              required
            />
          </div>
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer pb-2">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                className="rounded border-stone-300"
              />
              Featured on site
            </label>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 rounded-lg bg-[#7f4e1c] hover:bg-[#633a11] text-stone-900 text-sm font-semibold">
            {editing ? 'Save changes' : 'Add plan'}
          </button>
          {editing && (
            <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg bg-stone-100 text-stone-600 text-sm">
              Cancel
            </button>
          )}
        </div>
      </form>

      <AdminTableToolbar
        searchInput={table.searchInput}
        onSearchChange={table.setSearchInput}
        searchPlaceholder="Search tier, id, amount…"
        filters={[
          { id: 'all', label: 'All' },
          { id: 'featured', label: 'Featured' },
          { id: 'standard', label: 'Standard' },
          { id: 'has_purchases', label: 'Has purchases' },
        ]}
        filter={table.filter}
        onFilterChange={table.setFilter}
        total={table.total}
        page={table.page}
        totalPages={table.totalPages}
        onPageChange={table.setPage}
      />

      <AdminTableCard>
        <AdminTable minWidth="min-w-[720px]">
          <AdminThead>
            <tr>
              <AdminTh>Tier</AdminTh>
              <AdminTh align="right">Amount</AdminTh>
              <AdminTh align="right">Monthly return</AdminTh>
              <AdminTh align="center">Purchases</AdminTh>
              <AdminTh align="right">Actions</AdminTh>
            </tr>
          </AdminThead>
          <AdminTbody>
            {table.paginated.length === 0 ? (
              <AdminEmptyRow colSpan={5} message="No plans match your filters." />
            ) : (
              table.paginated.map((p) => (
                <AdminTr key={p.id}>
                  <AdminTd>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-stone-900">{p.tier}</span>
                      {p.featured && <AdminBadge tone="info">Featured</AdminBadge>}
                    </div>
                    <div className={`${adminTypography.meta} font-mono mt-1`}>{p.id}</div>
                  </AdminTd>
                  <AdminTd align="right" mono accent>
                    <AdminMoney amount={formatINR(p.amount)} />
                  </AdminTd>
                  <AdminTd align="right" mono>
                    {formatINR(p.monthlyReturn)}
                  </AdminTd>
                  <AdminTd align="center">
                    <span className="inline-flex min-w-[2rem] justify-center px-2 py-0.5 rounded-full bg-[#f8f1e8] text-[#7f4e1c] text-xs font-bold">
                      {countPurchasesByPlan(p.id, p.tier, purchases)}
                    </span>
                  </AdminTd>
                  <AdminTd align="right">
                    <AdminIconActions>
                      <AdminIconButton label="Edit plan" onClick={() => startEdit(p)}>
                        <Pencil className="w-4 h-4" />
                      </AdminIconButton>
                      <AdminIconButton label="Delete plan" variant="danger" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="w-4 h-4" />
                      </AdminIconButton>
                    </AdminIconActions>
                  </AdminTd>
                </AdminTr>
              ))
            )}
          </AdminTbody>
        </AdminTable>
      </AdminTableCard>
      <p className={adminTypography.meta}>
        Plans and purchases sync live via the API — changes here appear on the member site immediately.
      </p>
    </div>
  );
}
