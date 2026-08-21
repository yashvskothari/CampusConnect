import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import { recommendationApi } from '../../services';
import { formatCurrency } from '../../utils';
import type { Job } from '../../types';

export default function FreelancerRecommendationsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recommendationApi.getJobMatches().then(({ data }) => setJobs(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="h-6 w-6 text-purple-600" /> AI Job Matchmaker</h1>
        <p className="text-surface-700">Jobs ranked by compatibility: 40% skills + 30% category + 20% rating + 10% experience</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" /></div>
      ) : jobs.length === 0 ? (
        <EmptyState title="No matching jobs" description="Update your skills to get better recommendations" />
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold text-purple-600">{job.matchScore}%</span>
                    <span className="text-xs text-surface-700">compatibility</span>
                  </div>
                  <h3 className="font-semibold text-lg">{job.title}</h3>
                  <p className="text-sm text-surface-700 mt-1">{job.category} · {formatCurrency(job.budget)}</p>
                  {job.breakdown && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(job.breakdown).map(([key, val]) => (
                        <span key={key} className="text-xs bg-surface-200 px-2 py-0.5 rounded">{key.replace(/([A-Z])/g, ' $1').trim()}: {val}%</span>
                      ))}
                    </div>
                  )}
                </div>
                <Link to={`/jobs/${job.id}`}><Button>View & Bid</Button></Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
