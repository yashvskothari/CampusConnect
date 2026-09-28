import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, Plus, Download, Pencil, Ban, CheckCircle2, KeyRound, Trash2, Eye } from 'lucide-react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Avatar from '../../components/Avatar';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import { adminApi } from '../../services';
import { formatDate, formatDateTime, formatCurrency, getErrorMessage } from '../../utils';
import type { AdminUser, AdminUserDetail } from '../../types';

type Editable = 'CLIENT' | 'FREELANCER';

/* ------------------------------ Create / Edit ------------------------------ */

function UserFormModal({
  user, open, onClose, onSaved,
}: { user: AdminUser | null; open: boolean; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!user;
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'FREELANCER' as Editable, bio: '', skills: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      name: user?.name ?? '',
      email: user?.email ?? '',
      password: '',
      role: (user?.role === 'CLIENT' ? 'CLIENT' : 'FREELANCER') as Editable,
      bio: user?.bio ?? '',
      skills: user?.skills?.join(', ') ?? '',
    });
  }, [open, user]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    if (!isEdit && form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    const skills = form.skills.split(',').map((s) => s.trim()).filter(Boolean);
    setSaving(true);
    try {
      if (isEdit && user) {
        await adminApi.updateUser(user.id, {
          name: form.name.trim(), email: form.email.trim(), role: form.role, bio: form.bio, skills,
        });
        toast.success('User updated');
      } else {
        await adminApi.createUser({
          name: form.name.trim(), email: form.email.trim(), password: form.password,
          role: form.role, bio: form.bio || undefined, skills,
        });
        toast.success('User created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save user'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit user' : 'Create user'}>
      <form onSubmit={submit} className="space-y-4">
        <Input label="Name" value={form.name} onChange={set('name')} />
        <Input label="Email" type="email" value={form.email} onChange={set('email')} />
        {!isEdit && <Input label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" />}
        <Select label="Role" value={form.role} onChange={set('role')}>
          <option value="FREELANCER">Freelancer</option>
          <option value="CLIENT">Client</option>
        </Select>
        <div className="space-y-1">
          <label htmlFor="bio" className="block text-sm font-medium text-surface-800">Bio</label>
          <textarea
            id="bio" rows={3} value={form.bio} onChange={set('bio')}
            className="w-full rounded-lg border border-surface-400 bg-surface-200 px-3 py-2 text-sm text-surface-900 placeholder:text-surface-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <Input label="Skills (comma separated)" value={form.skills} onChange={set('skills')} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>{isEdit ? 'Save changes' : 'Create user'}</Button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------ Detail ------------------------------ */

function UserDetailModal({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);

  useEffect(() => {
    setDetail(null);
    if (!userId) return;
    adminApi.getUser(userId).then(({ data }) => setDetail(data)).catch(() => {
      toast.error('Failed to load user');
      onClose();
    });
  }, [userId, onClose]);

  return (
    <Modal open={!!userId} onClose={onClose} title="User details" className="max-w-2xl">
      {!detail ? (
        <div className="py-10 text-center text-sm text-surface-700">Loading…</div>
      ) : (
        <div className="space-y-5 text-sm">
          <div className="flex items-center gap-3">
            <Avatar name={detail.name} src={detail.avatar} size="lg" />
            <div className="min-w-0">
              <p className="text-base font-semibold text-surface-900">{detail.name}</p>
              <p className="text-surface-700 truncate">{detail.email}</p>
              <div className="mt-1 flex gap-2"><Badge status={detail.role} /><Badge status={detail.status} /></div>
            </div>
          </div>

          {detail.status === 'SUSPENDED' && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-300">
              Suspended{detail.suspendedAt ? ` on ${formatDate(detail.suspendedAt)}` : ''}
              {detail.suspensionReason ? ` — ${detail.suspensionReason}` : ''}
            </div>
          )}

          <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
            <div><dt className="text-surface-700">Joined</dt><dd>{formatDate(detail.createdAt)}</dd></div>
            <div><dt className="text-surface-700">Last login</dt><dd>{detail.lastLoginAt ? formatDateTime(detail.lastLoginAt) : 'Never'}</dd></div>
            <div><dt className="text-surface-700">Rating</dt><dd>{detail.rating ? detail.rating.toFixed(1) : '—'}</dd></div>
            <div><dt className="text-surface-700">Skills</dt><dd>{detail.skills?.length ? detail.skills.join(', ') : '—'}</dd></div>
          </dl>
          {detail.bio && <p className="text-surface-800">{detail.bio}</p>}

          {detail._count && (
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                ['Jobs posted', detail._count.jobs],
                ['Bids placed', detail._count.bids],
                ['Services', detail._count.services],
                ['Reviews given', detail._count.reviewsGiven],
                ['Reviews received', detail._count.reviewsReceived],
                ['Payments', detail._count.paymentsAsClient + detail._count.paymentsAsFreelancer],
              ].map(([label, n]) => (
                <div key={label as string} className="rounded-lg border border-surface-300 bg-surface-200 p-2">
                  <p className="text-lg font-semibold">{n}</p>
                  <p className="text-xs text-surface-700">{label}</p>
                </div>
              ))}
            </div>
          )}

          {detail.recentJobs.length > 0 && (
            <div>
              <h4 className="mb-2 font-semibold">Recent jobs</h4>
              <ul className="space-y-1">
                {detail.recentJobs.map((j) => (
                  <li key={j.id} className="flex justify-between gap-3">
                    <Link to={`/jobs/${j.id}`} className="truncate hover:text-primary-400">{j.title}</Link>
                    <span className="flex shrink-0 items-center gap-2"><span className="text-surface-700">{formatCurrency(j.budget)}</span><Badge status={j.status} /></span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {detail.recentBids.length > 0 && (
            <div>
              <h4 className="mb-2 font-semibold">Recent bids</h4>
              <ul className="space-y-1">
                {detail.recentBids.map((b) => (
                  <li key={b.id} className="flex justify-between gap-3">
                    <Link to={`/jobs/${b.jobId}`} className="hover:text-primary-400">{formatCurrency(b.quote)} · {formatDate(b.createdAt)}</Link>
                    <Badge status={b.status} />
                  </li>
                ))}
              </ul>
            </div>
          )}
          {detail.recentPayments.length > 0 && (
            <div>
              <h4 className="mb-2 font-semibold">Recent payments</h4>
              <ul className="space-y-1">
                {detail.recentPayments.map((p) => (
                  <li key={p.id} className="flex justify-between gap-3">
                    <span>{formatCurrency(p.amount)} · {formatDate(p.createdAt)}</span>
                    <Badge status={p.status} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

/* ------------------------------ Page ------------------------------ */

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('createdAt:desc');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [formUser, setFormUser] = useState<AdminUser | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const closeDetail = useCallback(() => setDetailId(null), []);

  const [suspendTarget, setSuspendTarget] = useState<AdminUser | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [passwordTarget, setPasswordTarget] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);
  const [bulkAction, setBulkAction] = useState<'suspend' | 'unsuspend' | 'delete' | null>(null);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const [sortBy, order] = sort.split(':');
    adminApi
      .getUsers({ page, limit: 20, sortBy, order, ...(search && { search }), ...(role && { role }), ...(status && { status }) })
      .then(({ data }) => {
        if (cancelled) return;
        setUsers(data.data);
        setPagination(data.pagination);
        setSelected(new Set());
      })
      .catch(() => !cancelled && toast.error('Failed to load users'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [page, search, role, status, sort, reloadKey]);

  const selectableUsers = users.filter((u) => u.role !== 'ADMIN');
  const allSelected = selectableUsers.length > 0 && selectableUsers.every((u) => selected.has(u.id));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const handleExport = async () => {
    try {
      const { data } = await adminApi.exportUsers({ ...(search && { search }), ...(role && { role }), ...(status && { status }) });
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed');
    }
  };

  const doSuspend = async () => {
    if (!suspendTarget) return;
    try {
      await adminApi.suspendUser(suspendTarget.id, suspendReason.trim() || undefined);
      toast.success(`${suspendTarget.name} suspended`);
      setSuspendTarget(null); setSuspendReason(''); reload();
    } catch (err) { toast.error(getErrorMessage(err, 'Failed to suspend user')); }
  };

  const doUnsuspend = async (u: AdminUser) => {
    try {
      await adminApi.unsuspendUser(u.id);
      toast.success(`${u.name} reactivated`);
      reload();
    } catch (err) { toast.error(getErrorMessage(err, 'Failed to reactivate user')); }
  };

  const doResetPassword = async () => {
    if (!passwordTarget) return;
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await adminApi.resetUserPassword(passwordTarget.id, newPassword);
      toast.success('Password updated');
      setPasswordTarget(null); setNewPassword('');
    } catch (err) { toast.error(getErrorMessage(err, 'Failed to update password')); }
  };

  const doDelete = async (force: boolean) => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteUser(deleteTarget.id, force);
      toast.success('User deleted');
      setDeleteTarget(null); setDeleteWarning(null); reload();
    } catch (err) {
      const e = err as { response?: { status?: number; data?: { error?: string } } };
      if (e.response?.status === 409) {
        setDeleteWarning(e.response.data?.error ?? 'User has active work.');
      } else {
        toast.error(getErrorMessage(err, 'Failed to delete user'));
      }
    }
  };

  const doBulk = async () => {
    if (!bulkAction) return;
    try {
      const { data } = await adminApi.bulkUsers({
        action: bulkAction,
        userIds: [...selected],
        ...(bulkAction === 'suspend' && suspendReason.trim() ? { reason: suspendReason.trim() } : {}),
      });
      toast.success(`${data.affected} user(s) updated${data.skipped ? `, ${data.skipped} skipped` : ''}`);
      setBulkAction(null); setSuspendReason(''); reload();
    } catch (err) { toast.error(getErrorMessage(err, 'Bulk action failed')); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Users</h1>
          <p className="text-surface-700">Create, edit, suspend and remove client and freelancer accounts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4" /> Export CSV</Button>
          <Button size="sm" onClick={() => { setFormUser(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> New user</Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-600" />
            <Input
              aria-label="Search users" placeholder="Search name or email" className="pl-9"
              value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Select aria-label="Filter by role" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
            <option value="">All roles</option>
            <option value="CLIENT">Clients</option>
            <option value="FREELANCER">Freelancers</option>
            <option value="ADMIN">Admins</option>
          </Select>
          <Select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </Select>
          <Select aria-label="Sort" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
            <option value="createdAt:desc">Newest first</option>
            <option value="createdAt:asc">Oldest first</option>
            <option value="name:asc">Name A–Z</option>
            <option value="lastLoginAt:desc">Recently active</option>
            <option value="rating:desc">Highest rated</option>
          </Select>
        </div>
      </Card>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary-500/30 bg-primary-500/10 px-4 py-3 text-sm">
          <span className="font-medium text-primary-300">{selected.size} selected</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setBulkAction('suspend')}>Suspend</Button>
            <Button size="sm" variant="outline" onClick={() => setBulkAction('unsuspend')}>Reactivate</Button>
            <Button size="sm" variant="danger" onClick={() => setBulkAction('delete')}>Delete</Button>
          </div>
        </div>
      )}

      <Card className="p-0 overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="p-10 text-center text-sm text-surface-700">Loading users…</div>
        ) : users.length === 0 ? (
          <EmptyState title="No users found" description="Try adjusting your search or filters" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-surface-300 bg-surface-200 text-xs uppercase tracking-wider text-surface-700">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox" aria-label="Select all" checked={allSelected}
                      onChange={() => setSelected(allSelected ? new Set() : new Set(selectableUsers.map((u) => u.id)))}
                      className="accent-emerald-500"
                    />
                  </th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="hidden md:table-cell px-4 py-3">Joined</th>
                  <th className="hidden lg:table-cell px-4 py-3">Last login</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={loading ? 'opacity-60' : ''}>
                {users.map((u) => {
                  const isAdmin = u.role === 'ADMIN';
                  return (
                    <tr key={u.id} className="border-b border-surface-300 last:border-0 hover:bg-surface-200/50">
                      <td className="px-4 py-3">
                        {!isAdmin && (
                          <input
                            type="checkbox" aria-label={`Select ${u.name}`} checked={selected.has(u.id)}
                            onChange={() => toggle(u.id)} className="accent-emerald-500"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} src={u.avatar} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium text-surface-900 truncate">{u.name}</p>
                            <p className="text-xs text-surface-700 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge status={u.role} /></td>
                      <td className="px-4 py-3"><Badge status={u.status} /></td>
                      <td className="hidden md:table-cell px-4 py-3 text-surface-700">{formatDate(u.createdAt)}</td>
                      <td className="hidden lg:table-cell px-4 py-3 text-surface-700">{u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never'}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <IconBtn label="View details" onClick={() => setDetailId(u.id)}><Eye className="h-4 w-4" /></IconBtn>
                          {!isAdmin && (
                            <>
                              <IconBtn label="Edit" onClick={() => { setFormUser(u); setFormOpen(true); }}><Pencil className="h-4 w-4" /></IconBtn>
                              <IconBtn label="Reset password" onClick={() => setPasswordTarget(u)}><KeyRound className="h-4 w-4" /></IconBtn>
                              {u.status === 'ACTIVE' ? (
                                <IconBtn label="Suspend" onClick={() => setSuspendTarget(u)}><Ban className="h-4 w-4" /></IconBtn>
                              ) : (
                                <IconBtn label="Reactivate" onClick={() => doUnsuspend(u)}><CheckCircle2 className="h-4 w-4" /></IconBtn>
                              )}
                              <IconBtn label="Delete" danger onClick={() => { setDeleteWarning(null); setDeleteTarget(u); }}><Trash2 className="h-4 w-4" /></IconBtn>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onChange={setPage} />

      <UserFormModal user={formUser} open={formOpen} onClose={() => setFormOpen(false)} onSaved={reload} />
      <UserDetailModal userId={detailId} onClose={closeDetail} />

      <ConfirmModal
        open={!!suspendTarget} title="Suspend user" confirmLabel="Suspend" danger
        message={<>{suspendTarget?.name} will be logged out and unable to sign in until reactivated.</>}
        onConfirm={doSuspend} onClose={() => { setSuspendTarget(null); setSuspendReason(''); }}
      >
        <Input label="Reason (optional)" value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} maxLength={500} />
      </ConfirmModal>

      <ConfirmModal
        open={!!passwordTarget} title="Reset password" confirmLabel="Update password"
        message={<>Set a new password for {passwordTarget?.name}. Share it with them securely.</>}
        onConfirm={doResetPassword} onClose={() => { setPasswordTarget(null); setNewPassword(''); }}
      >
        <Input label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 6 characters" />
      </ConfirmModal>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete user permanently"
        confirmLabel={deleteWarning ? 'Delete anyway' : 'Delete'}
        danger
        message={
          <>
            <p>
              This permanently deletes <strong>{deleteTarget?.name}</strong> and all their jobs, bids, services,
              messages and reviews. This cannot be undone.
            </p>
            {deleteWarning && (
              <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-300">{deleteWarning}</p>
            )}
          </>
        }
        onConfirm={() => doDelete(!!deleteWarning)}
        onClose={() => { setDeleteTarget(null); setDeleteWarning(null); }}
      />

      <ConfirmModal
        open={!!bulkAction}
        title={bulkAction === 'delete' ? 'Delete selected users' : bulkAction === 'suspend' ? 'Suspend selected users' : 'Reactivate selected users'}
        confirmLabel={bulkAction === 'delete' ? 'Delete' : bulkAction === 'suspend' ? 'Suspend' : 'Reactivate'}
        danger={bulkAction !== 'unsuspend'}
        message={<>{bulkAction === 'delete' ? 'Permanently delete' : 'Apply to'} {selected.size} user(s)? Admin accounts are always skipped.</>}
        onConfirm={doBulk} onClose={() => { setBulkAction(null); setSuspendReason(''); }}
      >
        {bulkAction === 'suspend' && (
          <Input label="Reason (optional)" value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} maxLength={500} />
        )}
      </ConfirmModal>
    </div>
  );
}

function IconBtn({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button" title={label} aria-label={label} onClick={onClick}
      className={`rounded-lg p-1.5 transition-colors hover:bg-surface-300 ${danger ? 'text-surface-700 hover:text-red-400' : 'text-surface-700 hover:text-primary-400'}`}
    >
      {children}
    </button>
  );
}
