import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { bidApi } from '../../services';
import { formatCurrency } from '../../utils';
import type { Bid } from '../../types';

export default function FreelancerBidsPage() {
  const { user } = useAuth();
  const [bids, setBids] = useState<Bid[]>([]);

  useEffect(() => {
    if (!user) return;
    bidApi.getAll({ freelancerId: user.id }).then(({ data }) => setBids(data)).catch(() => {});
  }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Bids</h1>
      {bids.length === 0 ? (
        <EmptyState title="No bids submitted" description="Browse open jobs and submit proposals" action={<Link to="/jobs" className="text-primary-400">Browse Jobs</Link>} />
      ) : (
        <div className="space-y-4">
          {bids.map((bid) => (
            <Card key={bid.id}>
              <div className="flex items-start justify-between">
                <div>
                  <Link to={`/jobs/${bid.jobId}`} className="font-semibold hover:text-primary-400">{bid.job?.title ?? 'Job'}</Link>
                  <p className="text-sm text-surface-700 mt-1 line-clamp-2">{bid.proposal}</p>
                  <div className="mt-2 flex gap-4 text-sm">
                    <span className="font-medium text-primary-400">{formatCurrency(bid.quote)}</span>
                    <span>{bid.deliveryDays} days</span>
                  </div>
                </div>
                <Badge status={bid.status} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
