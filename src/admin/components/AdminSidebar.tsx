import React, { useEffect } from 'react';
import { ExternalLink, LogOut, X } from 'lucide-react';
import { type AdminTabId, type AdminNavItem, type AdminNavSection } from '../../lib/admin';
import { ADMIN_NAV_ICONS } from '../../lib/adminNav';
import { buildMemberEntryUrl } from '../../lib/appBridge';
import type { AdminOverviewStats } from '../../lib/adminStats';
import { adminNavActive, adminNavIdle, adminTypography } from '../adminTheme';
import logo from '../../assets/Images/gaulaxmi-logo.png';

function navBadgeCount(itemId: AdminTabId, stats: AdminOverviewStats): number | null {
  if (itemId === 'kyc' && stats.pendingKyc > 0) return stats.pendingKyc;
  if (itemId === 'deposit_requests' && stats.pendingDeposits > 0) return stats.pendingDeposits;
  if (itemId === 'withdrawals' && stats.pendingWithdrawals > 0) return stats.pendingWithdrawals;
  if (itemId === 'inquiries' && stats.newInquiries > 0) return stats.newInquiries;
  if (itemId === 'support_tickets' && stats.openSupportTickets > 0) {
    return stats.openSupportTickets;
  }
  return null;
}

function badgeTone(itemId: AdminTabId): string {
  if (itemId === 'kyc') return 'bg-red-500 text-white';
  if (itemId === 'deposit_requests') return 'bg-emerald-100 text-emerald-800';
  if (itemId === 'withdrawals') return 'bg-amber-100 text-amber-800';
  if (itemId === 'support_tickets') return 'bg-violet-100 text-violet-800';
  return 'bg-sky-100 text-sky-800';
}

function NavButton({
  item,
  active,
  badge,
  onClick,
}: {
  item: AdminNavItem;
  active: boolean;
  badge: number | null;
  onClick: () => void;
}) {
  const Icon = ADMIN_NAV_ICONS[item.id];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${active ? adminNavActive : adminNavIdle} group`}
    >
      <Icon
        className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-[#7f4e1c] group-hover:text-[#7f4e1c]'}`}
        strokeWidth={2.25}
      />
      <span className="flex-1 min-w-0 text-left truncate">{item.label}</span>
      {badge != null && (
        <span className={`shrink-0 ${adminTypography.navBadge} ${badgeTone(item.id)}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function SidebarContent({
  tab,
  stats,
  navSections,
  adminEmail,
  onSelectTab,
  onLogout,
  onCloseMobile,
}: {
  tab: AdminTabId;
  stats: AdminOverviewStats;
  navSections: AdminNavSection[];
  adminEmail?: string;
  onSelectTab: (id: AdminTabId) => void;
  onLogout: () => void;
  onCloseMobile?: () => void;
}) {
  const select = (id: AdminTabId) => {
    onSelectTab(id);
    onCloseMobile?.();
  };

  return (
    <>
      <div className="shrink-0 pb-5 mb-4 border-b border-stone-100">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <img src={logo} alt="Gaulaxmi" className="h-11 w-11 object-contain shrink-0" />
            <div className="min-w-0">
              <p className={adminTypography.brandTitle}>Gaulaxmi</p>
              <p className={`${adminTypography.brandEyebrow} mt-0.5`}>Admin Console</p>
            </div>
          </div>
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden shrink-0 p-2 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-800"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {adminEmail && (
          <p className="mt-3 text-xs text-stone-500 truncate" title={adminEmail}>
            {adminEmail}
          </p>
        )}
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1 -mr-1 space-y-5 admin-sidebar-nav">
        {navSections.map((group) => (
          <div key={group.section}>
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">
              {group.section}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <React.Fragment key={item.id}>
                  <NavButton
                    item={item}
                    active={tab === item.id}
                    badge={navBadgeCount(item.id, stats)}
                    onClick={() => select(item.id)}
                  />
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 pt-4 mt-2 border-t border-stone-100 space-y-1">
        <a
          href={buildMemberEntryUrl()}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-[#f8f1e8] hover:text-[#7f4e1c] transition"
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          <span>Member site</span>
        </a>
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-stone-600 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </>
  );
}

export function AdminSidebar({
  tab,
  stats,
  navSections,
  adminEmail,
  onSelectTab,
  onLogout,
  mobileOpen,
  onMobileOpenChange,
}: {
  tab: AdminTabId;
  stats: AdminOverviewStats;
  navSections: AdminNavSection[];
  adminEmail?: string;
  onSelectTab: (id: AdminTabId) => void;
  onLogout: () => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}) {
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          className="lg:hidden fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-[2px]"
          aria-label="Close menu"
          onClick={() => onMobileOpenChange(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-[min(100vw-3rem,18rem)] max-w-[288px] bg-white border-r border-stone-200 shadow-xl flex flex-col p-5 transition-transform duration-200 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
        aria-hidden={!mobileOpen}
      >
        <SidebarContent
          tab={tab}
          stats={stats}
          navSections={navSections}
          adminEmail={adminEmail}
          onSelectTab={onSelectTab}
          onLogout={onLogout}
          onCloseMobile={() => onMobileOpenChange(false)}
        />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 z-30 w-72 flex-col border-r border-stone-200 bg-white shadow-sm">
        <div className="flex flex-col h-full min-h-0 p-5">
          <SidebarContent
            tab={tab}
            stats={stats}
            navSections={navSections}
            adminEmail={adminEmail}
            onSelectTab={onSelectTab}
            onLogout={onLogout}
          />
        </div>
      </aside>
    </>
  );
}
