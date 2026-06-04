export {
  ALL_ADMIN_PERMISSIONS,
  ADMIN_PERMISSION_GROUPS,
  SUPER_ADMIN_EMAILS,
  type AdminPermission,
  type AdminStaffRole,
  canAccessAdminTab,
  getAdminPermissions,
  hasAdminPermission,
  isPanelAdminUser,
  isSuperAdminUser,
  isStaffAdminUser,
} from '../../shared/adminPermissions';

import type { AdminPermission } from '../../shared/adminPermissions';
import {
  ADMIN_NAV_SECTIONS,
  type AdminNavSection,
  type AdminTabId,
} from './admin';
import {
  canAccessAdminTab,
  getAdminPermissions,
  isSuperAdminUser,
  type AdminAccessUser,
} from '../../shared/adminPermissions';

export function filterAdminNavSections(
  user: AdminAccessUser | null | undefined
): AdminNavSection[] {
  const perms = new Set(getAdminPermissions(user));
  const sections: AdminNavSection[] = [];

  for (const group of ADMIN_NAV_SECTIONS) {
    const items = group.items.filter((item) => perms.has(item.id as AdminPermission));
    if (items.length > 0) {
      sections.push({ section: group.section, items });
    }
  }

  if (isSuperAdminUser(user)) {
    sections.push({
      section: 'Access control',
      items: [{ id: 'admins' as AdminTabId, label: 'Admin team & roles' }],
    });
  }

  return sections;
}

export function firstAllowedAdminTab(user: AdminAccessUser | null | undefined): AdminTabId {
  const sections = filterAdminNavSections(user);
  const first = sections[0]?.items[0]?.id;
  return first ?? 'overview';
}
