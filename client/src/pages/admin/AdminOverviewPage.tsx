import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Briefcase, DollarSign, UserX, Layers, Star } from 'lucide-react';
import Card from '../../components/Card';
import Skeleton from '../../components/Skeleton';
import { adminApi } from '../../services';
import { formatCurrency } from '../../utils';
import type { AdminStats } from '../../types';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    adminApi.stats().then(({ data }) => setStats(data)).catch(() => setError(true));
  }, []);

  if (error) {
    return <Card><p className="text-red-400">Failed to load dashboard stats.</p></Card>;
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const cards = [
    { label: 'Total Users', value: stats.users.total, icon: Users, color: 'bg-primary-500/15 text-primary-400' },
    { label: 'Clients / Freelancers', value: `${stats.users.clients} / ${stats.users.freelancers}`, icon: Users, color: 'bg-teal-100 text-teal-700' },
    { label: 'Suspended Users', value: stats.users.suspended, icon: UserX, color: 'bg-red-100 text-red-600' },
    { label: 'New (7 days)', value: stats.users.newLast7Days, icon: Users, color: 'bg-green-100 text-green-600' },
    { label: 'Open Jobs', value: stats.jobs.open, icon: Briefcase, color: 'bg-blue-100 text-blue-700' },
    { label: 'Jobs In Progress', value: stats.jobs.inProgress, icon: Briefcase, color: 'bg-amber-100 text-amber-600' },
    { label: 'Services Listed', value: stats.marketplace.services, icon: Layers, color: 'bg-primary-500/15 text-primary-400' },
    { label: 'Reviews', value: stats.marketplace.reviews, icon: Star, color: 'bg-amber-100 text-amber-600' },
  ];

  const maxSignups = Math.max(1, ...stats.signupsLast30Days.map((d) => d.count));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Admin Dashboard</h1>
        <p className="text-surface-700">Platform overview and user management</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${color}`}><Icon className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-surface-700">{label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-primary-400" />
            <h2 className="text-lg font-semibold">Payments</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-surface-700">Completed payments</dt><dd className="font-medium">{stats.payments.completedCount}</dd></div>
            <div className="flex justify-between"><dt className="text-surface-700">Total volume</dt><dd className="font-medium">{formatCurrency(stats.payments.totalVolume)}</dd></div>
            <div className="flex justify-between"><dt className="text-surface-700">Platform commission earned</dt><dd className="font-medium text-primary-400">{formatCurrency(stats.payments.totalCommission)}</dd></div>
            <div className="flex justify-between"><dt className="text-surface-700">Pending ({stats.payments.pendingCount})</dt><dd className="font-medium">{formatCurrency(stats.payments.pendingVolume)}</dd></div>
          </dl>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="h-5 w-5 text-primary-400" />
            <h2 className="text-lg font-semibold">Jobs by status</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-surface-700">Open</dt><dd className="font-medium">{stats.jobs.open}</dd></div>
            <div className="flex justify-between"><dt className="text-surface-700">In progress</dt><dd className="font-medium">{stats.jobs.inProgress}</dd></div>
            <div className="flex justify-between"><dt className="text-surface-700">Completed</dt><dd className="font-medium">{stats.jobs.completed}</dd></div>
            <div className="flex justify-between"><dt className="text-surface-700">Cancelled</dt><dd className="font-medium">{stats.jobs.cancelled}</dd></div>
          </dl>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Signups, last 30 days</h2>
          <span className="text-sm text-surface-700">{stats.users.newLast30Days} total</span>
        </div>
        {stats.signupsLast30Days.length === 0 ? (
          <p className="text-sm text-surface-700">No signups in this period.</p>
        ) : (
          <div className="flex h-32 items-end gap-1">
            {stats.signupsLast30Days.map((d) => (
              <div key={d.date} className="group relative flex-1" title={`${d.date}: ${d.count}`}>
                <div
                  className="w-full rounded-t bg-primary-500/70 group-hover:bg-primary-400"
                  style={{ height: `${Math.max(6, (d.count / maxSignups) * 100)}%` }}
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link to="/admin/users" className="text-primary-400 hover:text-primary-300 font-medium">Manage users →</Link>
        <Link to="/admin/audit-log" className="text-primary-400 hover:text-primary-300 font-medium">View audit log →</Link>
      </div>
    </div>
  );
}
