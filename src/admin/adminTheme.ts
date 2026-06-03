/** Shared Gaulaxmi admin UI tokens — matches member site (warm earth tones). */

export const adminBrand = {
  brown: '#7f4e1c',
  brownDark: '#633a11',
  brownDeep: '#593610',
  gold: '#9a5f23',
  cream: '#f8f1e8',
  creamBorder: '#d8cec1',
} as const;

export const adminShell = {
  root: 'admin-app min-h-screen bg-stone-50 text-stone-900 flex antialiased',
  sidebar:
    'hidden lg:flex flex-col w-72 shrink-0 border-r border-stone-200 bg-white shadow-sm p-5',
  header:
    'sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur-md px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm',
  main: 'flex-1 p-4 sm:p-6 lg:p-8 overflow-auto max-w-7xl w-full',
} as const;

export const adminTypography = {
  brandTitle: 'font-display text-lg font-bold text-primary leading-tight',
  brandEyebrow: 'admin-eyebrow text-[#7f4e1c]',
  navItem: 'text-sm font-medium',
  navBadge: 'text-xs font-bold px-1.5 py-0.5 rounded-full',
  pageTitle: 'admin-page-title',
  pageDesc: 'admin-page-desc',
  sectionTitle: 'admin-section-title',
  body: 'text-sm text-stone-700',
  meta: 'text-xs text-stone-500',
  label: 'text-xs font-semibold uppercase tracking-wide text-stone-500',
  kpiValue: 'text-2xl font-display font-bold leading-tight tabular-nums',
  kpiLabel: 'text-xs font-bold uppercase tracking-wide',
  tableHeader: 'text-xs font-bold uppercase tracking-wide text-[#8f5f3a]',
  tableCell: 'text-sm text-stone-700',
  btn: 'text-sm font-semibold',
  btnSm: 'text-xs font-semibold',
} as const;

export const adminCard =
  'bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden';

export const adminInput =
  'w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 outline-none focus:border-[#7f4e1c]/50 focus:ring-2 focus:ring-[#7f4e1c]/10';

export const adminSelect =
  'bg-white border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-[#7f4e1c]/50';

export const adminBtnPrimary =
  'bg-[#7f4e1c] hover:bg-[#633a11] text-white text-sm font-semibold rounded-xl transition shadow-sm';

export const adminBtnSecondary =
  'bg-[#f8f1e8] hover:bg-[#ede0cf] text-[#7b4b1d] text-sm font-semibold rounded-lg border border-[#d8cec1] transition';

export const adminNavActive =
  'w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors bg-[#7f4e1c] text-white shadow-sm';

export const adminNavIdle =
  'w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-stone-600 hover:bg-[#f8f1e8] hover:text-[#7f4e1c]';
