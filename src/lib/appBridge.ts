import { getToken, setToken } from './apiClient';
import { getAdminAppUrl, getMemberAppUrl } from './admin';

const HANDOFF_PARAM = 'handoff';
const OPEN_DASHBOARD_PARAM = 'openDashboard';

/** Read JWT from ?handoff= when crossing dev ports (3000 ↔ 3001). Same-origin /admin uses shared localStorage. */
export function consumeAuthHandoffFromUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const handoff = params.get(HANDOFF_PARAM);
  if (!handoff?.trim()) return false;

  setToken(handoff.trim());
  params.delete(HANDOFF_PARAM);
  const qs = params.toString();
  const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
  window.history.replaceState(null, '', next);
  return true;
}

function withCrossOriginHandoff(base: string): string {
  const token = getToken();
  if (!token || typeof window === 'undefined') return base;

  try {
    const target = new URL(base, window.location.href);
    if (target.origin === window.location.origin) return target.pathname + target.search;
    target.searchParams.set(HANDOFF_PARAM, token);
    return target.toString();
  } catch {
    return base;
  }
}

/** Admin URL; adds ?handoff= token when target is a different origin (standalone admin on :3001). */
export function buildAdminEntryUrl(): string {
  return withCrossOriginHandoff(getAdminAppUrl());
}

/** Member site URL; adds ?handoff= when leaving standalone admin (:3001). */
export function buildMemberEntryUrl(): string {
  return withCrossOriginHandoff(getMemberAppUrl());
}

/** Open member site as a specific user (admin impersonation) in a new tab. */
export function buildMemberDashboardHandoffUrl(memberToken: string, dashboardTab?: string): string {
  try {
    const url = new URL(getMemberAppUrl(), typeof window !== 'undefined' ? window.location.href : undefined);
    url.searchParams.set(HANDOFF_PARAM, memberToken);
    url.searchParams.set(OPEN_DASHBOARD_PARAM, '1');
    if (dashboardTab) url.searchParams.set('dashboardTab', dashboardTab);
    return url.toString();
  } catch {
    return getMemberAppUrl();
  }
}

/** After admin impersonation: open member dashboard when ?openDashboard=1 is present. */
export function consumeOpenDashboardFromUrl(): string | false {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get(OPEN_DASHBOARD_PARAM) !== '1') return false;
  const tab = params.get('dashboardTab');
  params.delete(OPEN_DASHBOARD_PARAM);
  params.delete('dashboardTab');
  const qs = params.toString();
  const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
  window.history.replaceState(null, '', next);
  return tab?.trim() || 'overview';
}
