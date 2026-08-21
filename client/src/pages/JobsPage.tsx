import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock } from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { SkeletonCard } from '../components/Skeleton';
import { jobApi } from '../services';
import { formatCurrency, formatDate } from '../utils';
import { CATEGORIES, type Job } from '../types';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { status: 'OPEN' };
      if (search) params.search = search;
      if (category) params.category = category;
      const { data } = await jobApi.getAll(params);
      setJobs(data);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-surface-900">Job Listings</h1>
          <p className="mt-2 text-surface-700">Find projects and submit your bid</p>
        </div>
        <Link to="/jobs/new"><Button>Post a Job</Button></Link>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); fetchJobs(); }} className="mb-8 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-600" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search jobs..." className="w-full rounded-lg border border-surface-400 pl-10 pr-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-surface-400 px-3 py-2 text-sm">
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="submit" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">Search</button>
      </form>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map((i) => <SkeletonCard key={i} />)}</div>
      ) : jobs.length === 0 ? (
        <EmptyState title="No jobs found" description="Be the first to post a job!" action={<Link to="/jobs/new"><Button>Post a Job</Button></Link>} />
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} hover>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge status={job.status} />
                    <span className="text-xs text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full">{job.category}</span>
                  </div>
                  <Link to={`/jobs/${job.id}`} className="text-lg font-semibold text-surface-900 hover:text-primary-400">{job.title}</Link>
                  <p className="mt-2 text-sm text-surface-700 line-clamp-2">{job.description}</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-surface-700">
                    <span className="font-medium text-primary-400">{formatCurrency(job.budget)}</span>
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Due {formatDate(job.deadline)}</span>
                    <span>{job._count?.bids ?? job.bids?.length ?? 0} bids</span>
                  </div>
                </div>
                <Link to={`/jobs/${job.id}`}><Button variant="outline" size="sm">View & Bid</Button></Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
