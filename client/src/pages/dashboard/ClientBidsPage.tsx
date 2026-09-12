import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check, Clock3, IndianRupee, UserRound } from 'lucide-react';

import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import { SkeletonCard } from '../../components/Skeleton';

import { useAuth } from '../../context/AuthContext';
import { jobApi, bidApi } from '../../services';
import { formatCurrency } from '../../utils';

import type { Bid } from '../../types';

export default function ClientBidsPage() {
  const { user } = useAuth();

  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingBid, setAcceptingBid] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    jobApi
      .getAll({ clientId: user.id })
      .then(({ data }) => {
        return Promise.all(
          data.map((job) => bidApi.getAll({ jobId: job.id }))
        );
      })
      .then((results) => {
        setBids(results.flatMap((result) => result.data));
      })
      .catch(() => {
        setBids([]);
        toast.error('Failed to load bids');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  const handleAccept = async (bidId: string) => {
    try {
      setAcceptingBid(bidId);

      await bidApi.accept(bidId);

      toast.success('Bid accepted! Payment initiated.');

      setBids((prev) =>
        prev.map((bid) =>
          bid.id === bidId
            ? { ...bid, status: 'ACCEPTED' }
            : bid
        )
      );
    } catch {
      toast.error('Failed to accept bid');
    } finally {
      setAcceptingBid(null);
    }
  };

  return (
    <div className="min-h-full">

      {/* ================= HEADER ================= */}

      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-surface-600">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
          Hiring Dashboard
        </div>

        <h1
          className="
            mt-3
            text-2xl font-bold tracking-tight
            text-surface-900
            sm:text-3xl
          "
        >
          Received Bids
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-surface-700">
          Review proposals from students and choose the right freelancer
          for your projects.
        </p>
      </div>

      {/* ================= LOADING ================= */}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : bids.length === 0 ? (

        /* ================= EMPTY STATE ================= */

        <div
          className="
            rounded-xl
            border-white/6
            bg-surface-100
            py-12
          "
        >
          <EmptyState
            title="No bids received"
            description="Post jobs to start receiving bids from freelancers."
          />
        </div>

      ) : (

        /* ================= BIDS ================= */

        <div className="space-y-4">

          {/* Result count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-surface-600">
              <span className="font-medium text-surface-800">
                {bids.length}
              </span>{' '}
              {bids.length === 1 ? 'proposal' : 'proposals'} received
            </p>
          </div>

          {bids.map((bid) => (
            <Card
              key={bid.id}
              className="
                group
                border border-white/6
                bg-surface-100
                transition-all duration-200
                hover:border-primary-500/20
              "
            >
              <div
                className="
                  flex flex-col gap-5
                  lg:flex-row
                  lg:items-start
                  lg:justify-between
                "
              >

                {/* ================= BID CONTENT ================= */}

                <div className="min-w-0 flex-1">

                  {/* Job title + status */}
                  <div
                    className="
                      flex flex-col gap-2
                      sm:flex-row sm:items-center
                      sm:justify-between
                    "
                  >
                    <Link
                      to={`/jobs/${bid.jobId}`}
                      className="
                        line-clamp-2
                        text-base font-semibold
                        leading-6
                        text-surface-900
                        transition-colors
                        hover:text-primary-400
                      "
                    >
                      {bid.job?.title ?? 'Job'}
                    </Link>

                    <div className="shrink-0 self-start">
                      <Badge status={bid.status} />
                    </div>
                  </div>

                  {/* Freelancer */}
                  <div className="mt-4 flex items-center gap-2">
                    <div
                      className="
                        flex h-8 w-8
                        items-center justify-center
                        rounded-full
                        border border-white/[0.07]
                        bg-surface-200
                      "
                    >
                      <UserRound className="h-4 w-4 text-surface-600" />
                    </div>

                    <div>
                      <p className="text-xs text-surface-600">
                        Freelancer
                      </p>

                      <p className="text-sm font-medium text-surface-800">
                        {bid.freelancer?.name ?? 'Unknown freelancer'}
                      </p>
                    </div>
                  </div>

                  {/* Proposal */}
                  <div className="mt-4">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-surface-600">
                      Proposal
                    </p>

                    <p
                      className="
                        line-clamp-4
                        text-sm
                        leading-6
                        text-surface-700
                      "
                    >
                      {bid.proposal}
                    </p>
                  </div>

                  {/* Bid details */}
                  <div
                    className="
                      mt-5
                      flex flex-wrap
                      items-center
                      gap-x-6 gap-y-3
                      border-t border-white/6
                      pt-4
                    "
                  >
                    {/* Quote */}
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-primary-500" />

                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-surface-600">
                          Quote
                        </p>

                        <p className="text-sm font-semibold text-primary-400">
                          {formatCurrency(bid.quote)}
                        </p>
                      </div>
                    </div>

                    {/* Delivery */}
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-surface-600" />

                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-surface-600">
                          Delivery
                        </p>

                        <p className="text-sm font-medium text-surface-800">
                          {bid.deliveryDays}{' '}
                          {bid.deliveryDays === 1 ? 'day' : 'days'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ================= ACTION ================= */}

                {bid.status === 'PENDING' && (
                  <div
                    className="
                      shrink-0
                      border-t border-white/6
                      pt-4
                      lg:border-t-0
                      lg:pl-5
                      lg:pt-0
                    "
                  >
                    <Button
                      size="sm"
                      onClick={() => handleAccept(bid.id)}
                      disabled={acceptingBid === bid.id}
                      className="
                        w-full
                        sm:w-auto
                      "
                    >
                      <Check className="mr-1.5 h-4 w-4" />

                      {acceptingBid === bid.id
                        ? 'Accepting...'
                        : 'Accept Bid'}
                    </Button>
                  </div>
                )}

                {bid.status === 'ACCEPTED' && (
                  <div
                    className="
                      flex shrink-0
                      items-center gap-2
                      rounded-lg
                      border border-primary-500/15
                      bg-primary-500/6
                      px-3 py-2
                      text-sm
                      font-medium
                      text-primary-400
                    "
                  >
                    <Check className="h-4 w-4" />
                    Accepted
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}