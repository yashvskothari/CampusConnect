import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Card from '../../components/Card';
import Select from '../../components/Select';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import { adminApi } from '../../services';
import { formatDateTime } from '../../utils';
import type { AuditLog } from '../../types';

function describe(log: AuditLog): string {
  const d = (log.details ?? {}) as Record<string, unknown>;
  const parts: string[] = [];
  if (d.email) parts.push(String(d.email));
  if (d.title) parts.push(`“${String(d.title)}”`);
  if (d.reason) parts.push(`reason: ${String(d.reason)}`);
  if (d.roleFrom && d.roleTo) parts.push(`role ${String(d.roleFrom)} → ${String(d.roleTo)}`);
  if (d.from && d.to) parts.push(`${String(d.from)} → ${String(d.to)}`);
  if (Array.isArray(d.fields)) parts.push(`fields: ${d.fields.join(', ')}`);
  if (typeof d.affected === 'number') parts.push(`${d.affected} affected`);
  if (typeof d.count === 'number') parts.push(`${d.count} rows`);
  if (d.forced) parts.push('forced');
  return parts.join(' · ');
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 1 });
  const [targetType, setTargetType] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getAuditLogs({ page, limit: 25, ...(targetType && { targetType }) })
      .then(({ data }) => { if (!cancelled) { setLogs(data.data); setPagination(data.pagination); } })
      .catch(() => !cancelled && toast.error('Failed to load audit log'));
    return () => { cancelled = true; };
  }, [page, targetType]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Audit Log</h1>
        <p className="text-surface-700">A record of every admin action on the platform</p>
      </div>

      <Card className="p-4">
        <div className="max-w-xs">
          <Select aria-label="Filter by type" value={targetType} onChange={(e) => { setTargetType(e.target.value); setPage(1); }}>
            <option value="">All types</option>
            <option value="User">Users</option>
            <option value="Job">Jobs</option>
            <option value="Service">Services</option>
            <option value="Review">Reviews</option>
          </Select>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {logs.length === 0 ? (
          <EmptyState title="No activity yet" description="Admin actions will appear here" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-surface-300 bg-surface-200 text-xs uppercase tracking-wider text-surface-700">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-surface-300 last:border-0 hover:bg-surface-200/50">
                    <td className="px-4 py-3 whitespace-nowrap text-surface-700">{formatDateTime(l.createdAt)}</td>
                    <td className="px-4 py-3">{l.admin?.name ?? <span className="text-surface-700">Deleted admin</span>}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-surface-200 px-2 py-0.5 text-xs font-medium text-surface-900">{l.action}</span>
                    </td>
                    <td className="px-4 py-3 text-surface-700">{describe(l) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onChange={setPage} />
    </div>
  );
}
