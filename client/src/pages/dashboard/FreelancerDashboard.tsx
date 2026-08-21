import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, DollarSign, MessageSquare, Sparkles } from 'lucide-react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { serviceApi, bidApi, recommendationApi } from '../../services';
import { formatCurrency } from '../../utils';
import type { Service, Bid, Job } from '../../types';

export default function FreelancerDashboard() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [recommendations, setRecommendations] = useState<Job[]>([]);

  useEffect(() => {
    if (!user) return;
    serviceApi.getAll().then(({ data }) => setServices(data.filter((s) => s.freelancerId === user.id))).catch(() => {});
    bidApi.getAll({ freelancerId: user.id }).then(({ data }) => setBids(data)).catch(() => {});
    recommendationApi.getJobMatches().then(({ data }) => setRecommendations(data.slice(0, 3))).catch(() => {});
  }, [user]);

  const activeBids = bids.filter((b) => b.status === 'PENDING' || b.status === 'ACCEPTED');
  const acceptedJobs = bids.filter((b) => b.status === 'ACCEPTED');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Welcome back, {user?.name}!</h1>
        <p className="text-surface-700">Here's your freelancer dashboard overview</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Services Listed', value: services.length, icon: Briefcase, color: 'bg-primary-500/15 text-primary-400' },
          { label: 'Active Bids', value: activeBids.length, icon: DollarSign, color: 'bg-purple-100 text-purple-600' },
          { label: 'Active Jobs', value: acceptedJobs.length, icon: Briefcase, color: 'bg-green-100 text-green-600' },
          { label: 'Rating', value: user?.rating.toFixed(1) ?? '0', icon: Sparkles, color: 'bg-amber-100 text-amber-600' },
        ].map(({ label, value, icon: Icon, color }) => (
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

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Sparkles className="h-5 w-5 text-purple-600" /> AI Job Recommendations</h2>
          <Link to="/dashboard/freelancer/recommendations" className="text-sm text-primary-400 hover:text-primary-300">View all</Link>
        </div>
        {recommendations.length === 0 ? (
          <EmptyState title="No recommendations yet" description="Add skills to your profile for better matches" />
        ) : (
          <div className="space-y-3">
            {recommendations.map((job) => (
              <div key={job.id} className="flex items-center justify-between border border-surface-300 rounded-lg p-3">
                <div>
                  <p className="font-medium">{job.title}</p>
                  <p className="text-sm text-surface-700">{formatCurrency(job.budget)} · {job.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-purple-600">{job.matchScore}% match</span>
                  <Link to={`/jobs/${job.id}`}><Button size="sm" variant="outline">View</Button></Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">My Services</h2>
            <Link to="/dashboard/freelancer/services"><Button size="sm" variant="outline">Manage</Button></Link>
          </div>
          {services.length === 0 ? (
            <EmptyState title="No services yet" description="List your first service to get started" action={<Link to="/dashboard/freelancer/services"><Button size="sm">Add Service</Button></Link>} />
          ) : (
            services.slice(0, 3).map((s) => (
              <div key={s.id} className="flex justify-between py-2 border-b border-surface-300 last:border-0">
                <span className="text-sm font-medium">{s.title}</span>
                <span className="text-sm text-primary-400">{formatCurrency(s.price)}</span>
              </div>
            ))
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Bids</h2>
            <Link to="/dashboard/freelancer/bids"><Button size="sm" variant="outline">View all</Button></Link>
          </div>
          {bids.length === 0 ? (
            <EmptyState title="No bids yet" description="Browse jobs and submit your first bid" action={<Link to="/jobs"><Button size="sm">Browse Jobs</Button></Link>} />
          ) : (
            bids.slice(0, 3).map((b) => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b border-surface-300 last:border-0">
                <span className="text-sm font-medium truncate flex-1">{b.job?.title ?? 'Job'}</span>
                <Badge status={b.status} />
              </div>
            ))
          )}
        </Card>
      </div>

      <Link to="/messages"><Button variant="outline"><MessageSquare className="h-4 w-4" /> Go to Messages</Button></Link>
    </div>
  );
}
