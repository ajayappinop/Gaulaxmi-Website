import type { DbUser } from '../../shared/types.js';
import {
  type AdminPermission,
  getAdminPermissions,
  hasAdminPermission,
  isPanelAdminUser,
  isSuperAdminUser,
} from '../../shared/adminPermissions.js';

export { hasAdminPermission, isSuperAdminUser, isPanelAdminUser, getAdminPermissions };

export function getAdminAccessPayload(user: DbUser) {
  return {
    isSuperAdmin: isSuperAdminUser(user),
    adminRole: user.adminRole ?? (isSuperAdminUser(user) ? 'super_admin' : 'staff'),
    permissions: getAdminPermissions(user),
  };
}

export function assertAdminPermission(user: DbUser, permission: AdminPermission): void {
  if (!hasAdminPermission(user, permission)) {
    throw new Error('You do not have permission for this action');
  }
}

export function assertSuperAdmin(user: DbUser): void {
  if (!isSuperAdminUser(user)) {
    throw new Error('Super admin access required');
  }
}
