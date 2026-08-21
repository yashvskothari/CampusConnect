import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Users, DollarSign } from 'lucide-react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { jobApi, bidApi, paymentApi } from '../../services';
import { formatCurrency, formatDate } from '../../utils';
import type { Job, Bid, Payment } from '../../types';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    if (!user) return;
    jobApi.getAll({ clientId: user.id }).then(({ data }) => setJobs(data)).catch(() => {});
    jobApi.getAll({ clientId: user.id }).then(({ data }) => {
      const jobIds = data.map((j) => j.id);
      Promise.all(jobIds.map((id) => bidApi.getAll({ jobId: id }))).then((results) => {
        setBids(results.flatMap((r) => r.data));
      });
    }).catch(() => {});
    paymentApi.getAll().then(({ data }) => setPayments(data)).catch(() => {});
  }, [user]);

  const openJobs = jobs.filter((j) => j.status === 'OPEN');
  const inProgress = jobs.filter((j) => j.status === 'IN_PROGRESS');
  const pendingBids = bids.filter((b) => b.status === 'PENDING');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Client Dashboard</h1>
        <p className="text-surface-700">Manage your jobs, bids, and payments</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Posted Jobs', value: jobs.length, icon: Briefcase, color: 'bg-primary-500/15 text-primary-400' },
          { label: 'Open Jobs', value: openJobs.length, icon: Briefcase, color: 'bg-green-100 text-green-600' },
          { label: 'Pending Bids', value: pendingBids.length, icon: Users, color: 'bg-purple-100 text-purple-600' },
          { label: 'In Progress', value: inProgress.length, icon: DollarSign, color: 'bg-amber-100 text-amber-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${color}`}><Icon className="h-5 w-5" /></div>
              <div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-surface-700">{label}</p></div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Posted Jobs</h2>
          <Link to="/jobs/new"><Button size="sm">Post New Job</Button></Link>
        </div>
        {jobs.length === 0 ? (
          <EmptyState title="No jobs posted" description="Post your first job to find freelancers" action={<Link to="/jobs/new"><Button size="sm">Post Job</Button></Link>} />
        ) : (
          <div className="space-y-3">
            {jobs.slice(0, 5).map((job) => (
              <div key={job.id} className="flex items-center justify-between border border-surface-300 rounded-lg p-3">
                <div>
                  <Link to={`/jobs/${job.id}`} className="font-medium hover:text-primary-400">{job.title}</Link>
                  <p className="text-sm text-surface-700">{formatCurrency(job.budget)} · Due {formatDate(job.deadline)}</p>
                </div>
                <Badge status={job.status} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Recent Payments</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-surface-700">No payments yet. Accept a bid to initiate payment.</p>
        ) : (
          payments.slice(0, 3).map((p) => (
            <div key={p.id} className="flex justify-between py-2 border-b border-surface-300 last:border-0 text-sm">
              <span>{formatCurrency(p.amount)} to {p.freelancer?.name}</span>
              <Badge status={p.status} />
            </div>
          ))
        )}
        <Link to="/dashboard/client/payments" className="mt-3 inline-block text-sm text-primary-400">View all payments</Link>
      </Card>
    </div>
  );
}
