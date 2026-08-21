import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { jobApi, bidApi } from '../../services';
import { formatCurrency } from '../../utils';
import type { Bid } from '../../types';

export default function ClientBidsPage() {
  const { user } = useAuth();
  const [bids, setBids] = useState<Bid[]>([]);

  useEffect(() => {
    if (!user) return;
    jobApi.getAll({ clientId: user.id }).then(({ data }) => {
      Promise.all(data.map((j) => bidApi.getAll({ jobId: j.id }))).then((results) => {
        setBids(results.flatMap((r) => r.data));
      });
    });
  }, [user]);

  const handleAccept = async (bidId: string) => {
    try {
      await bidApi.accept(bidId);
      toast.success('Bid accepted! Payment initiated.');
      setBids((prev) => prev.map((b) => b.id === bidId ? { ...b, status: 'ACCEPTED' } : b));
    } catch {
      toast.error('Failed to accept bid');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Received Bids</h1>
      {bids.length === 0 ? (
        <EmptyState title="No bids received" description="Post jobs to start receiving bids from freelancers" />
      ) : (
        <div className="space-y-4">
          {bids.map((bid) => (
            <Card key={bid.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link to={`/jobs/${bid.jobId}`} className="font-semibold hover:text-primary-400">{bid.job?.title ?? 'Job'}</Link>
                  <p className="text-sm text-surface-800 mt-2">{bid.proposal}</p>
                  <div className="mt-2 flex gap-4 text-sm">
                    <span>By: {bid.freelancer?.name}</span>
                    <span className="font-medium text-primary-400">{formatCurrency(bid.quote)}</span>
                    <span>{bid.deliveryDays} days</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge status={bid.status} />
                  {bid.status === 'PENDING' && (
                    <Button size="sm" onClick={() => handleAccept(bid.id)}>Accept</Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
