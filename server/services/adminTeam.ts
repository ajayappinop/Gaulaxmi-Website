import bcrypt from 'bcryptjs';
import { getStore } from '../store/index.js';
import { findDbUser, findDbUserByEmail } from './users.js';
import { assertSuperAdmin } from './adminAccess.js';
import { newId, walletAddress, toPublicUser } from '../utils.js';
import type { DbUser, User } from '../../shared/types.js';
import {
  ALL_ADMIN_PERMISSIONS,
  type AdminPermission,
  type AdminStaffRole,
  isSuperAdminUser,
  normalizeAdminEmail,
} from '../../shared/adminPermissions.js';

export interface AdminTeamMember {
  id: string;
  name: string;
  email: string;
  adminRole: AdminStaffRole;
  adminPermissions: AdminPermission[];
}

function sanitizePermissions(perms: unknown): AdminPermission[] {
  if (!Array.isArray(perms)) return [];
  return perms.filter((p): p is AdminPermission =>
    ALL_ADMIN_PERMISSIONS.includes(p as AdminPermission)
  );
}

export async function listAdminTeam(): Promise<AdminTeamMember[]> {
  const users = await getStore().listUsers();
  return users
    .filter((u) => u.role === 'admin')
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      adminRole: (u.adminRole ??
        (isSuperAdminUser(u) ? 'super_admin' : 'staff')) as AdminStaffRole,
      adminPermissions:
        u.adminRole === 'super_admin' || isSuperAdminUser(u)
          ? [...ALL_ADMIN_PERMISSIONS]
          : sanitizePermissions(u.adminPermissions),
    }))
    .sort((a, b) => {
      if (a.adminRole === 'super_admin') return -1;
      if (b.adminRole === 'super_admin') return 1;
      return a.name.localeCompare(b.name);
    });
}

export async function createStaffAdmin(
  actorId: string,
  body: {
    email: string;
    name: string;
    password: string;
    permissions: AdminPermission[];
  }
): Promise<User> {
  const actor = await findDbUser(actorId);
  if (!actor) throw new Error('User not found');
  assertSuperAdmin(actor);

  const email = normalizeAdminEmail(body.email);
  const name = String(body.name || '').trim();
  const password = String(body.password || '');
  const permissions = sanitizePermissions(body.permissions);

  if (!email) throw new Error('Email is required');
  if (name.length < 2) throw new Error('Name must be at least 2 characters');
  if (password.length < 6) throw new Error('Password must be at least 6 characters');
  if (permissions.length === 0) {
    throw new Error('Select at least one permission');
  }

  const store = getStore();
  const existing = await findDbUserByEmail(email);
  if (existing) {
    if (isSuperAdminUser(existing)) {
      throw new Error('Cannot modify the super admin account this way');
    }
    existing.role = 'admin';
    existing.adminRole = 'staff';
    existing.adminPermissions = permissions;
    existing.name = name;
    if (password.length >= 6) {
      existing.passwordHash = bcrypt.hashSync(password, 10);
    }
    await store.saveUser(existing);
    return toPublicUser(existing);
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const id = newId('adm_');
  const newUser: DbUser = {
    id,
    role: 'admin',
    adminRole: 'staff',
    adminPermissions: permissions,
    name,
    email,
    passwordHash,
    balance: 0,
    walletAddress: walletAddress(),
    isKycVerified: true,
    kycStatus: 'verified',
    investments: [],
    transactions: [],
    referrals: [],
    referralLink: `https://gaulaxmi.com/ref/${id}`,
    phone: '',
  };

  await store.insertUser(newUser);
  return toPublicUser(newUser);
}

export async function updateStaffAdmin(
  actorId: string,
  targetId: string,
  body: {
    name?: string;
    permissions?: AdminPermission[];
    password?: string;
  }
): Promise<User> {
  const actor = await findDbUser(actorId);
  if (!actor) throw new Error('User not found');
  assertSuperAdmin(actor);

  const target = await findDbUser(targetId);
  if (!target) throw new Error('Admin user not found');
  if (isSuperAdminUser(target)) {
    throw new Error('Super admin role cannot be changed');
  }
  if (target.id === actorId && body.permissions) {
    throw new Error('You cannot change your own permissions');
  }

  const permissions =
    body.permissions !== undefined ? sanitizePermissions(body.permissions) : undefined;
  if (permissions && permissions.length === 0) {
    throw new Error('Select at least one permission');
  }

  if (body.name?.trim()) target.name = body.name.trim();
  if (permissions) {
    target.role = 'admin';
    target.adminRole = 'staff';
    target.adminPermissions = permissions;
  }
  if (body.password && String(body.password).length >= 6) {
    target.passwordHash = bcrypt.hashSync(String(body.password), 10);
  }

  await getStore().saveUser(target);
  return toPublicUser(target);
}

export async function revokeStaffAdmin(actorId: string, targetId: string): Promise<User> {
  const actor = await findDbUser(actorId);
  if (!actor) throw new Error('User not found');
  assertSuperAdmin(actor);

  const target = await findDbUser(targetId);
  if (!target) throw new Error('Admin user not found');
  if (isSuperAdminUser(target)) {
    throw new Error('Cannot revoke super admin access');
  }
  if (target.id === actorId) {
    throw new Error('You cannot revoke your own admin access');
  }

  target.role = 'member';
  delete target.adminRole;
  delete target.adminPermissions;
  await getStore().saveUser(target);
  return toPublicUser(target);
}
