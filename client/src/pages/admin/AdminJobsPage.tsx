import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, Trash2 } from 'lucide-react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';
import { adminApi } from '../../services';
import { formatCurrency, formatDate, getErrorMessage } from '../../utils';
import type { AdminJob } from '../../types';

const STATUSES = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  const [deleteTarget, setDeleteTarget] = useState<AdminJob | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getJobs({ page, limit: 20, ...(search && { search }), ...(status && { status }) })
      .then(({ data }) => { if (!cancelled) { setJobs(data.data); setPagination(data.pagination); } })
      .catch(() => !cancelled && toast.error('Failed to load jobs'));
    return () => { cancelled = true; };
  }, [page, search, status, reloadKey]);

  const changeStatus = async (job: AdminJob, next: string) => {
    try {
      await adminApi.updateJobStatus(job.id, next);
      toast.success('Job status updated');
      reload();
    } catch (err) { toast.error(getErrorMessage(err, 'Failed to update status')); }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteJob(deleteTarget.id);
      toast.success('Job deleted');
      setDeleteTarget(null);
      reload();
    } catch (err) { toast.error(getErrorMessage(err, 'Failed to delete job')); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Jobs</h1>
        <p className="text-surface-700">Moderate job postings</p>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-600" />
            <Input aria-label="Search jobs" placeholder="Search title or description" className="pl-9" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </div>
          <Select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </Select>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {jobs.length === 0 ? (
          <EmptyState title="No jobs found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-surface-300 bg-surface-200 text-xs uppercase tracking-wider text-surface-700">
                <tr>
                  <th className="px-4 py-3">Job</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Budget</th>
                  <th className="hidden md:table-cell px-4 py-3">Bids</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="hidden md:table-cell px-4 py-3">Posted</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id} className="border-b border-surface-300 last:border-0 hover:bg-surface-200/50">
                    <td className="px-4 py-3 max-w-xs">
                      <Link to={`/jobs/${j.id}`} className="font-medium hover:text-primary-400 line-clamp-1">{j.title}</Link>
                      <p className="text-xs text-surface-700">{j.category}</p>
                    </td>
                    <td className="px-4 py-3 text-surface-800">{j.client?.name}</td>
                    <td className="px-4 py-3">{formatCurrency(j.budget)}</td>
                    <td className="hidden md:table-cell px-4 py-3">{j._count?.bids ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Badge status={j.status} />
                        <select
                          aria-label={`Change status of ${j.title}`}
                          value={j.status}
                          onChange={(e) => changeStatus(j, e.target.value)}
                          className="rounded-md border border-surface-400 bg-surface-200 px-1.5 py-1 text-xs text-surface-900"
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-surface-700">{formatDate(j.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        title="Delete job" aria-label="Delete job" onClick={() => setDeleteTarget(j)}
                        className="rounded-lg p-1.5 text-surface-700 hover:bg-surface-300 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onChange={setPage} />

      <ConfirmModal
        open={!!deleteTarget} title="Delete job" confirmLabel="Delete" danger
        message={<>Delete “{deleteTarget?.title}” and all of its bids? This cannot be undone.</>}
        onConfirm={doDelete} onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
