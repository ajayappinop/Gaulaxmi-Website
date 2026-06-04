import React, { useCallback, useEffect, useState } from 'react';
import { Shield, UserPlus, Pencil, UserX, X, Check, Mail, User, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { AdminPermission } from '../../../shared/types';
import { api } from '../../lib/apiClient';
import {
  ADMIN_PERMISSION_GROUPS,
  ALL_ADMIN_PERMISSIONS,
} from '../../lib/adminPermissions';
import { AdminPageHeader } from '../components/AdminPageHeader';
import {
  adminCard,
  adminBtnPrimary,
  adminBtnSecondary,
  adminInput,
  adminTypography,
} from '../adminTheme';

type TeamRow = {
  id: string;
  name: string;
  email: string;
  adminRole: 'super_admin' | 'staff';
  adminPermissions: AdminPermission[];
};

const fieldLabel =
  'block text-[10px] font-bold uppercase tracking-wide text-stone-400 mb-1.5';

function togglePerm(
  id: AdminPermission,
  checked: boolean,
  target: AdminPermission[]
): AdminPermission[] {
  if (checked) return [...new Set([...target, id])];
  return target.filter((p) => p !== id);
}

function AdminTeamFormModal({
  mode,
  title,
  subtitle,
  email,
  emailReadOnly,
  name,
  password,
  passwordLabel,
  passwordRequired,
  permissions,
  saving,
  onClose,
  onEmailChange,
  onNameChange,
  onPasswordChange,
  onPermissionsChange,
  onSubmit,
}: {
  mode: 'create' | 'edit';
  title: string;
  subtitle: string;
  email: string;
  emailReadOnly?: boolean;
  name: string;
  password: string;
  passwordLabel: string;
  passwordRequired?: boolean;
  permissions: AdminPermission[];
  saving: boolean;
  onClose: () => void;
  onEmailChange?: (v: string) => void;
  onNameChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onPermissionsChange: (p: AdminPermission[]) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const formId = 'admin-team-form';

  const selectAll = () => onPermissionsChange([...ALL_ADMIN_PERMISSIONS]);
  const clearAll = () => onPermissionsChange([]);

  const selectGroup = (ids: AdminPermission[]) => {
    onPermissionsChange([...new Set([...permissions, ...ids])]);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
      onClick={() => !saving && onClose()}
      role="presentation"
    >
      <div
        className="bg-white w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col overflow-hidden border border-stone-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-team-modal-title"
      >
        <div className="flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-stone-100 bg-gradient-to-r from-white via-white to-[#faf7f2] shrink-0">
          <div className="min-w-0">
            <p id="admin-team-modal-title" className="font-display font-bold text-lg text-stone-900">
              {title}
            </p>
            <p className="text-sm text-stone-500 mt-0.5">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-2 rounded-xl hover:bg-stone-100 text-stone-500 shrink-0 cursor-pointer disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          id={formId}
          onSubmit={onSubmit}
          className="flex-1 overflow-y-auto overscroll-contain"
        >
          <div className="p-5 sm:p-6 space-y-6">
            <section>
              <h3 className={`${adminTypography.sectionTitle} mb-1`}>Account details</h3>
              <p className={`${adminTypography.meta} mb-4`}>
                {mode === 'create'
                  ? 'Creates a new admin login or upgrades an existing member by email.'
                  : 'Update display name or reset password.'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={emailReadOnly ? 'sm:col-span-2' : ''}>
                  <label className={fieldLabel}>
                    <span className="inline-flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Email
                    </span>
                  </label>
                  <input
                    type="email"
                    required={!emailReadOnly}
                    readOnly={emailReadOnly}
                    value={email}
                    onChange={(e) => onEmailChange?.(e.target.value)}
                    placeholder="name@company.com"
                    className={`${adminInput} ${emailReadOnly ? 'bg-stone-50 text-stone-500' : ''}`}
                  />
                </div>
                <div>
                  <label className={fieldLabel}>
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3 h-3" /> Full name
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="Admin name"
                    className={adminInput}
                  />
                </div>
                <div className={emailReadOnly ? 'sm:col-span-2' : ''}>
                  <label className={fieldLabel}>
                    <span className="inline-flex items-center gap-1">
                      <Lock className="w-3 h-3" /> {passwordLabel}
                    </span>
                  </label>
                  <input
                    type="password"
                    required={passwordRequired}
                    minLength={passwordRequired ? 6 : undefined}
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    placeholder={passwordRequired ? 'Minimum 6 characters' : 'Leave blank to keep current'}
                    className={adminInput}
                    autoComplete={mode === 'create' ? 'new-password' : 'off'}
                  />
                </div>
              </div>
            </section>

            <section className="border-t border-stone-100 pt-6">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className={adminTypography.sectionTitle}>Panel permissions</h3>
                  <p className={`${adminTypography.meta} mt-0.5`}>
                    <span className="font-semibold text-[#7f4e1c]">{permissions.length}</span> of{' '}
                    {ALL_ADMIN_PERMISSIONS.length} areas selected
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className={`${adminBtnSecondary} px-3 py-1.5 text-xs`}
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>
              </div>

              {permissions.length === 0 && (
                <p className="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                  Select at least one permission so this admin can access the panel.
                </p>
              )}

              <div className="space-y-5">
                {ADMIN_PERMISSION_GROUPS.map((group) => {
                  const groupIds = group.permissions.map((p) => p.id);
                  const groupSelected = groupIds.filter((id) => permissions.includes(id)).length;
                  return (
                    <div
                      key={group.section}
                      className="rounded-xl border border-[#eae0d5]/90 bg-[#fcfaf7]/50 overflow-hidden"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-white/80 border-b border-stone-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8f5f3a]">
                          {group.section}
                        </p>
                        <button
                          type="button"
                          onClick={() => selectGroup(groupIds)}
                          className="text-[10px] font-bold uppercase text-[#7f4e1c] hover:underline cursor-pointer"
                        >
                          {groupSelected === groupIds.length ? 'All selected' : 'Select section'}
                        </button>
                      </div>
                      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.permissions.map((p) => {
                          const checked = permissions.includes(p.id);
                          return (
                            <label
                              key={p.id}
                              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                                checked
                                  ? 'border-[#7f4e1c]/40 bg-[#f8f1e8] shadow-sm'
                                  : 'border-stone-100 bg-white hover:border-[#d8cec1]'
                              }`}
                            >
                              <span
                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                                  checked
                                    ? 'bg-[#7f4e1c] border-[#7f4e1c] text-white'
                                    : 'border-stone-300 bg-white'
                                }`}
                              >
                                {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                              </span>
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={checked}
                                onChange={(e) =>
                                  onPermissionsChange(
                                    togglePerm(p.id, e.target.checked, permissions)
                                  )
                                }
                              />
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold text-stone-800">
                                  {p.label}
                                </span>
                                {p.description && (
                                  <span className="block text-xs text-stone-500 mt-0.5 leading-snug">
                                    {p.description}
                                  </span>
                                )}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </form>

        <div className="shrink-0 px-5 sm:px-6 py-4 border-t border-stone-100 bg-stone-50/80 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className={`${adminBtnSecondary} w-full sm:w-auto px-5 py-2.5 cursor-pointer disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={saving || permissions.length === 0}
            className={`${adminBtnPrimary} w-full sm:w-auto px-6 py-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {saving
              ? mode === 'create'
                ? 'Creating…'
                : 'Saving…'
              : mode === 'create'
                ? 'Create admin'
                : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminTeamTab({ currentUserId }: { currentUserId: string }) {
  const [team, setTeam] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editRow, setEditRow] = useState<TeamRow | null>(null);

  const [formEmail, setFormEmail] = useState('');
  const [formName, setFormName] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPerms, setFormPerms] = useState<AdminPermission[]>([
    'overview',
    'kyc',
    'support_tickets',
  ]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTeam(await api.getAdminTeam());
    } catch {
      toast.error('Could not load admin team');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formPerms.length === 0) {
      toast.error('Select at least one permission');
      return;
    }
    setSaving(true);
    try {
      await api.createAdminTeamMember({
        email: formEmail.trim(),
        name: formName.trim(),
        password: formPassword,
        permissions: formPerms,
      });
      toast.success('Admin account created');
      setShowCreate(false);
      setFormEmail('');
      setFormName('');
      setFormPassword('');
      setFormPerms(['overview', 'kyc', 'support_tickets']);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRow || formPerms.length === 0) {
      toast.error('Select at least one permission');
      return;
    }
    setSaving(true);
    try {
      await api.updateAdminTeamMember(editRow.id, {
        name: formName.trim() || undefined,
        permissions: formPerms,
        password: formPassword.length >= 6 ? formPassword : undefined,
      });
      toast.success('Admin updated');
      setEditRow(null);
      setFormPassword('');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const revoke = async (row: TeamRow) => {
    if (row.adminRole === 'super_admin') return;
    if (!window.confirm(`Revoke admin access for ${row.name}?`)) return;
    try {
      await api.revokeAdminTeamMember(row.id);
      toast.success('Admin access revoked');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Revoke failed');
    }
  };

  const openCreate = () => {
    setFormEmail('');
    setFormName('');
    setFormPassword('');
    setFormPerms(['overview', 'kyc', 'support_tickets']);
    setShowCreate(true);
  };

  const openEdit = (row: TeamRow) => {
    setEditRow(row);
    setFormName(row.name);
    setFormEmail(row.email);
    setFormPassword('');
    setFormPerms([...row.adminPermissions]);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Admin team & roles"
        subtitle="Super admin only — create staff admins and assign panel permissions"
        icon={Shield}
      />

      <div className={`${adminCard} p-5 flex flex-wrap items-center justify-between gap-3`}>
        <p className="text-sm text-stone-600 max-w-xl">
          The super admin (<strong>admin@gaulaxmi.io</strong>) has full access. Staff admins only
          see tabs you enable when adding or editing them.
        </p>
        <button
          type="button"
          onClick={openCreate}
          className={`${adminBtnPrimary} inline-flex items-center gap-2 px-4 py-2.5 cursor-pointer`}
        >
          <UserPlus className="w-4 h-4" />
          Add admin
        </button>
      </div>

      <div className={`${adminCard} overflow-hidden`}>
        {loading ? (
          <p className="p-8 text-sm text-stone-500 text-center">Loading team…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm text-left">
              <thead>
                <tr className="bg-stone-50 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Permissions</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {team.map((row) => (
                  <tr key={row.id} className="hover:bg-[#faf7f2]/60">
                    <td className="px-5 py-3 font-medium text-stone-900">{row.name}</td>
                    <td className="px-4 py-3 text-stone-600">{row.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex text-xs font-bold px-2 py-0.5 rounded-full border ${
                          row.adminRole === 'super_admin'
                            ? 'bg-violet-50 text-violet-800 border-violet-200'
                            : 'bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        {row.adminRole === 'super_admin' ? 'Super admin' : 'Staff'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">
                      {row.adminRole === 'super_admin'
                        ? 'All areas'
                        : `${row.adminPermissions.length} enabled`}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {row.adminRole === 'staff' && (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className={`${adminBtnSecondary} inline-flex items-center gap-1 text-xs py-1.5 cursor-pointer`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          {row.id !== currentUserId && (
                            <button
                              type="button"
                              onClick={() => void revoke(row)}
                              className="inline-flex items-center gap-1 text-xs py-1.5 px-2.5 rounded-lg font-semibold text-red-700 bg-red-50 border border-red-100 hover:bg-red-100 cursor-pointer"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              Revoke
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <AdminTeamFormModal
          mode="create"
          title="Add staff admin"
          subtitle="They will sign in to the admin panel with the permissions you choose."
          email={formEmail}
          name={formName}
          password={formPassword}
          passwordLabel="Password"
          passwordRequired
          permissions={formPerms}
          saving={saving}
          onClose={() => !saving && setShowCreate(false)}
          onEmailChange={setFormEmail}
          onNameChange={setFormName}
          onPasswordChange={setFormPassword}
          onPermissionsChange={setFormPerms}
          onSubmit={submitCreate}
        />
      )}

      {editRow && (
        <AdminTeamFormModal
          mode="edit"
          title={`Edit admin`}
          subtitle={editRow.email}
          email={formEmail}
          emailReadOnly
          name={formName}
          password={formPassword}
          passwordLabel="New password (optional)"
          permissions={formPerms}
          saving={saving}
          onClose={() => !saving && setEditRow(null)}
          onNameChange={setFormName}
          onPasswordChange={setFormPassword}
          onPermissionsChange={setFormPerms}
          onSubmit={submitEdit}
        />
      )}
    </div>
  );
}
