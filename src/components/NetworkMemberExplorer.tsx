import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowUpDown,
  ChevronRight,
  IndianRupee,
  Mail,
  Phone,
  User,
  Users,
  X,
} from 'lucide-react';
import type { Referral } from '../lib/auth';
import { formatINR } from '../lib/plans';
import {
  findNetworkMember,
  getMemberDownline,
  incomeRowsForMember,
  sortNetworkMembers,
  type FlatNetworkMember,
  type MemberNetworkSummary,
  type NetworkIncomeRow,
  type NetworkMemberSortField,
} from '../lib/memberNetwork';

export type NetworkExplorerPerspective = 'member' | 'admin';

const SORT_OPTIONS: { id: NetworkMemberSortField; label: string }[] = [
  { id: 'name', label: 'Name' },
  { id: 'investment', label: 'Investment' },
  { id: 'earnings', label: 'Earnings' },
  { id: 'level', label: 'Level' },
  { id: 'joined', label: 'Join date' },
];

function StatusBadge({ status }: { status: 'active' | 'pending' }) {
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
        status === 'active'
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-amber-50 text-amber-800 border-amber-200'
      }`}
    >
      {status}
    </span>
  );
}

function SortBar({
  sortField,
  sortOrder,
  onSortFieldChange,
  onSortOrderToggle,
  variant = 'member',
}: {
  sortField: NetworkMemberSortField;
  sortOrder: 'asc' | 'desc';
  onSortFieldChange: (field: NetworkMemberSortField) => void;
  onSortOrderToggle: () => void;
  variant?: NetworkExplorerPerspective;
}) {
  const selectClass =
    variant === 'admin'
      ? 'bg-stone-50 border-stone-200 text-stone-800'
      : 'bg-white border-stone-200 text-stone-800';

  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Sort by</span>
      <select
        value={sortField}
        onChange={(e) => onSortFieldChange(e.target.value as NetworkMemberSortField)}
        className={`text-xs font-semibold rounded-lg border px-2.5 py-1.5 cursor-pointer ${selectClass}`}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onSortOrderToggle}
        className={`inline-flex items-center gap-1 text-xs font-semibold rounded-lg border px-2.5 py-1.5 cursor-pointer transition hover:bg-stone-50 ${selectClass}`}
      >
        <ArrowUpDown className="w-3.5 h-3.5" />
        {sortOrder === 'desc' ? 'High → low' : 'Low → high'}
      </button>
    </div>
  );
}

function IncomeMiniTable({ rows, emptyLabel }: { rows: NetworkIncomeRow[]; emptyLabel: string }) {
  if (rows.length === 0) {
    return <p className="text-xs text-stone-500 py-2">{emptyLabel}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200">
      <table className="w-full text-left text-xs min-w-[420px]">
        <thead>
          <tr className="bg-stone-50 border-b border-stone-200 text-[10px] font-bold uppercase text-stone-500">
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Description</th>
            <th className="px-3 py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-2 text-stone-600 whitespace-nowrap">
                {new Date(row.date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </td>
              <td className="px-3 py-2 capitalize text-stone-600">{row.kind}</td>
              <td className="px-3 py-2 text-stone-600">{row.label}</td>
              <td className="px-3 py-2 text-right font-semibold text-emerald-700">
                +{formatINR(row.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NetworkMemberDetailPanel({
  member,
  summary,
  referrals,
  viewerName,
  perspective,
  onClose,
  onSelectMember,
  breadcrumb,
  onBack,
}: {
  member: FlatNetworkMember;
  summary: MemberNetworkSummary;
  referrals: Referral[];
  viewerName: string;
  perspective: NetworkExplorerPerspective;
  onClose: () => void;
  onSelectMember: (member: FlatNetworkMember) => void;
  breadcrumb: FlatNetworkMember[];
  onBack: () => void;
}) {
  const downline = useMemo(
    () => getMemberDownline(referrals, member.id, member.name, member.level),
    [referrals, member]
  );
  const memberIncome = useMemo(
    () => incomeRowsForMember(summary.incomeRows, member.name),
    [summary.incomeRows, member.name]
  );
  const earnedLabel =
    perspective === 'admin' ? `${viewerName} earned` : 'You earned';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="rounded-2xl border border-[#edd8c4] bg-[#faf7f2]/80 p-4 sm:p-5 space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {breadcrumb.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 text-[11px] text-stone-500 mb-2">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1 font-semibold text-[#7f4e1c] hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                Back
              </button>
              {breadcrumb.map((b) => (
                <span key={b.id} className="inline-flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" />
                  <span className="truncate max-w-[120px]">{b.name}</span>
                </span>
              ))}
              <ChevronRight className="w-3 h-3" />
              <span className="font-semibold text-stone-700 truncate max-w-[140px]">{member.name}</span>
            </div>
          )}
          <h4 className="font-display font-bold text-lg text-stone-900">{member.name}</h4>
          <p className="text-xs text-stone-500 font-mono mt-0.5">{member.id}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg border border-stone-200 text-stone-500 hover:bg-white cursor-pointer"
          aria-label="Close details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl bg-white border border-stone-200 p-3">
          <p className="text-[10px] font-bold uppercase text-stone-400">Level</p>
          <p className="font-bold text-[#7f4e1c] mt-1">L{member.level}</p>
        </div>
        <div className="rounded-xl bg-white border border-stone-200 p-3">
          <p className="text-[10px] font-bold uppercase text-stone-400">Status</p>
          <div className="mt-1">
            <StatusBadge status={member.status} />
          </div>
        </div>
        <div className="rounded-xl bg-white border border-stone-200 p-3">
          <p className="text-[10px] font-bold uppercase text-stone-400">Their investment</p>
          <p className="font-bold text-stone-900 mt-1">
            {member.investmentTotal > 0 ? formatINR(member.investmentTotal) : '—'}
          </p>
        </div>
        <div className="rounded-xl bg-white border border-stone-200 p-3">
          <p className="text-[10px] font-bold uppercase text-stone-400">{earnedLabel}</p>
          <p className="font-bold text-emerald-700 mt-1">{formatINR(member.bonusEarned)}</p>
        </div>
      </div>

      <dl className="grid sm:grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-stone-700">
          <User className="w-4 h-4 text-stone-400 shrink-0" />
          <span className="text-stone-500">Referred by:</span>
          <span className="font-medium">{member.referredBy}</span>
        </div>
        <div className="flex items-center gap-2 text-stone-700">
          <span className="text-stone-500">Joined:</span>
          <span className="font-medium">{member.joinDate}</span>
        </div>
        {member.phone !== '—' && (
          <div className="flex items-center gap-2 text-stone-700">
            <Phone className="w-4 h-4 text-stone-400 shrink-0" />
            <span>{member.phone}</span>
          </div>
        )}
        {member.email !== '—' && (
          <div className="flex items-center gap-2 text-stone-700 min-w-0">
            <Mail className="w-4 h-4 text-stone-400 shrink-0" />
            <span className="truncate">{member.email}</span>
          </div>
        )}
      </dl>

      <section>
        <h5 className="text-sm font-bold text-stone-900 mb-2 flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-[#7f4e1c]" />
          Income from {member.name}
        </h5>
        <IncomeMiniTable
          rows={memberIncome}
          emptyLabel={`No referral income recorded from ${member.name} yet.`}
        />
      </section>

      <section>
        <h5 className="text-sm font-bold text-stone-900 mb-2 flex items-center gap-2">
          <Users className="w-4 h-4 text-[#7f4e1c]" />
          People referred by {member.name}
          <span className="text-xs font-normal text-stone-500">({downline.length})</span>
        </h5>
        {downline.length === 0 ? (
          <p className="text-xs text-stone-500 py-2">
            {member.name} has not referred anyone yet.
          </p>
        ) : (
          <div className="space-y-2">
            {downline.map((child) => (
              <button
                key={child.id}
                type="button"
                onClick={() => onSelectMember(child)}
                className="w-full flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-left hover:border-[#edd8c4] hover:bg-[#faf7f2] transition cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-stone-900 truncate">{child.name}</p>
                  <p className="text-[11px] text-stone-500">
                    L{child.level} · {child.status} ·{' '}
                    {child.investmentTotal > 0 ? formatINR(child.investmentTotal) : 'No investment'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-emerald-700">{formatINR(child.bonusEarned)}</p>
                  <p className="text-[10px] text-stone-400">{earnedLabel.toLowerCase()}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}

export function NetworkMemberExplorer({
  members,
  summary,
  referrals,
  viewerName,
  perspective = 'member',
  showReferredBy = false,
  emptyMessage,
}: {
  members: FlatNetworkMember[];
  summary: MemberNetworkSummary;
  referrals: Referral[];
  viewerName: string;
  perspective?: NetworkExplorerPerspective;
  showReferredBy?: boolean;
  emptyMessage: string;
}) {
  const [sortField, setSortField] = useState<NetworkMemberSortField>('investment');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<FlatNetworkMember[]>([]);

  const sortedMembers = useMemo(
    () => sortNetworkMembers(members, sortField, sortOrder),
    [members, sortField, sortOrder]
  );

  const selectedMember = selectedId
    ? findNetworkMember(summary, selectedId) ??
      sortedMembers.find((m) => m.id === selectedId) ??
      breadcrumb.find((m) => m.id === selectedId)
    : null;

  const earnedHeader = perspective === 'admin' ? `${viewerName} earned` : 'You earned';

  const openMember = (member: FlatNetworkMember, pushToBreadcrumb = false) => {
    if (pushToBreadcrumb && selectedMember && selectedMember.id !== member.id) {
      setBreadcrumb((prev) => [...prev, selectedMember]);
    } else if (!pushToBreadcrumb) {
      setBreadcrumb([]);
    }
    setSelectedId(member.id);
  };

  const handleBack = () => {
    const prev = breadcrumb[breadcrumb.length - 1];
    if (!prev) {
      setSelectedId(null);
      setBreadcrumb([]);
      return;
    }
    setBreadcrumb((stack) => stack.slice(0, -1));
    setSelectedId(prev.id);
  };

  const handleClose = () => {
    setSelectedId(null);
    setBreadcrumb([]);
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-10 text-stone-500 border border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
        <Users className="w-8 h-8 mx-auto text-stone-300 mb-2" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SortBar
        sortField={sortField}
        sortOrder={sortOrder}
        onSortFieldChange={setSortField}
        onSortOrderToggle={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
        variant={perspective}
      />

      <AnimatePresence mode="wait">
        {selectedMember ? (
          <div key={selectedMember.id}>
            <NetworkMemberDetailPanel
              member={selectedMember}
              summary={summary}
              referrals={referrals}
              viewerName={viewerName}
              perspective={perspective}
              onClose={handleClose}
              onSelectMember={(m) => openMember(m, true)}
              breadcrumb={breadcrumb}
              onBack={handleBack}
            />
          </div>
        ) : null}
      </AnimatePresence>

      <div className="overflow-x-auto rounded-2xl border border-stone-200">
        <table className="w-full text-left text-sm min-w-[720px]">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200 text-[10px] font-bold uppercase tracking-wider text-stone-500">
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              {showReferredBy && <th className="px-4 py-3">Referred by</th>}
              <th className="px-4 py-3">Investment</th>
              <th className="px-4 py-3">{earnedHeader}</th>
              <th className="px-4 py-3">Their refs</th>
              <th className="px-4 py-3 w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {sortedMembers.map((m) => (
              <tr
                key={m.id}
                className={`transition-colors ${
                  selectedId === m.id ? 'bg-[#faf7f2]' : 'hover:bg-[#faf7f2]/60'
                }`}
              >
                <td className="px-4 py-3">
                  <div className="font-semibold text-stone-900">{m.name}</div>
                  <div className="text-[11px] text-stone-500 font-mono mt-0.5">{m.id}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-bold text-[#7f4e1c]">L{m.level}</span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={m.status} />
                </td>
                <td className="px-4 py-3 text-stone-600 whitespace-nowrap">{m.joinDate}</td>
                {showReferredBy && (
                  <td className="px-4 py-3 text-stone-600">{m.referredBy}</td>
                )}
                <td className="px-4 py-3 font-medium text-stone-800">
                  {m.investmentTotal > 0 ? formatINR(m.investmentTotal) : '—'}
                </td>
                <td className="px-4 py-3 font-bold text-emerald-700">
                  {m.bonusEarned > 0 ? formatINR(m.bonusEarned) : '₹0'}
                </td>
                <td className="px-4 py-3">
                  {m.referredCount > 0 ? (
                    <span className="font-semibold text-stone-800">{m.referredCount}</span>
                  ) : (
                    <span className="text-stone-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => openMember(m)}
                    className="text-xs font-bold text-[#7f4e1c] hover:underline cursor-pointer whitespace-nowrap"
                  >
                    View details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-stone-400">
        Tap <strong className="text-stone-600">View details</strong> to see a member&apos;s profile,
        your earnings from them, and who they referred — then open their referees the same way.
      </p>
    </div>
  );
}
