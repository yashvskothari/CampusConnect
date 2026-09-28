import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Select from '../../components/Select';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import { adminApi } from '../../services';
import { formatCurrency, formatDate } from '../../utils';
import type { AdminPayment } from '../../types';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [totals, setTotals] = useState({ amount: 0, commission: 0 });
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getPayments({ page, limit: 20, ...(status && { status }) })
      .then(({ data }) => {
        if (cancelled) return;
        setPayments(data.data);
        setTotals(data.totals);
        setPagination(data.pagination);
      })
      .catch(() => !cancelled && toast.error('Failed to load payments'));
    return () => { cancelled = true; };
  }, [page, status]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Payments</h1>
        <p className="text-surface-700">Read-only view of all platform payments</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><p className="text-2xl font-bold">{formatCurrency(totals.amount)}</p><p className="text-xs text-surface-700">Total (current filter)</p></Card>
        <Card><p className="text-2xl font-bold text-primary-400">{formatCurrency(totals.commission)}</p><p className="text-xs text-surface-700">Commission (current filter)</p></Card>
        <Card>
          <Select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
          </Select>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        {payments.length === 0 ? (
          <EmptyState title="No payments found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-surface-300 bg-surface-200 text-xs uppercase tracking-wider text-surface-700">
                <tr>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Freelancer</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="hidden md:table-cell px-4 py-3">Commission</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="hidden md:table-cell px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-surface-300 last:border-0 hover:bg-surface-200/50">
                    <td className="px-4 py-3">{p.client?.name}</td>
                    <td className="px-4 py-3">{p.freelancer?.name}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(p.amount)}</td>
                    <td className="hidden md:table-cell px-4 py-3 text-surface-700">{formatCurrency(p.commission)}</td>
                    <td className="px-4 py-3"><Badge status={p.status} /></td>
                    <td className="hidden md:table-cell px-4 py-3 text-surface-700">{formatDate(p.createdAt)}</td>
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
