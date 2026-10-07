import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import ChatModal from '../../components/chat/ChatModal';
import { useAuth } from '../../context/AuthContext';
import { bidApi } from '../../services';
import { formatCurrency } from '../../utils';
import type { Bid } from '../../types';

export default function FreelancerBidsPage() {
  const { user } = useAuth();
  const [bids, setBids] = useState<Bid[]>([]);
  const [activeChatUser, setActiveChatUser] = useState<{ id: string; name: string; avatar?: string } | null>(null);

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
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <Link to={`/jobs/${bid.jobId}`} className="font-semibold hover:text-primary-400">{bid.job?.title ?? 'Job'}</Link>
                  <p className="text-sm text-surface-700 mt-1 line-clamp-2">{bid.proposal}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                    <span className="font-medium text-primary-400">{formatCurrency(bid.quote)}</span>
                    <span>{bid.deliveryDays} days</span>
                    {bid.job?.client && (
                      <span className="text-xs text-surface-600">Client: {bid.job.client.name}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={bid.status} />
                  {bid.job?.client && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActiveChatUser({
                          id: bid.job!.client!.id,
                          name: bid.job!.client!.name,
                          avatar: (bid.job!.client as any).avatar,
                        });
                      }}
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-1" />
                      Chat
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeChatUser && (
        <ChatModal
          isOpen={Boolean(activeChatUser)}
          targetUserId={activeChatUser.id}
          targetUserName={activeChatUser.name}
          targetUserAvatar={activeChatUser.avatar}
          onClose={() => setActiveChatUser(null)}
        />
      )}
    </div>
  );
}
