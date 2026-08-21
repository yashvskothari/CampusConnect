import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Sparkles, Clock } from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Input from '../components/Input';
import Avatar from '../components/Avatar';
import Rating from '../components/Rating';
import { jobApi, bidApi, recommendationApi } from '../services';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils';
import type { Job, BidSuggestion } from '../types';

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [suggestion, setSuggestion] = useState<BidSuggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, setValue } = useForm();

  useEffect(() => {
    if (!id) return;
    jobApi.getById(id).then(({ data }) => setJob(data)).catch(() => toast.error('Job not found')).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (id && user?.role === 'FREELANCER') {
      recommendationApi.getBidSuggestion(id).then(({ data }) => {
        setSuggestion(data);
        setValue('quote', data.suggestedQuote);
        setValue('deliveryDays', data.suggestedDeliveryDays);
        setValue('proposal', data.proposalTemplate);
      }).catch(() => {});
    }
  }, [id, user, setValue]);

  const onSubmit = async (data: Record<string, string>) => {
    if (!id) return;
    setSubmitting(true);
    try {
      await bidApi.create({ jobId: id, proposal: data.proposal, quote: Number(data.quote), deliveryDays: Number(data.deliveryDays) });
      toast.success('Bid submitted successfully!');
      const { data: updated } = await jobApi.getById(id);
      setJob(updated);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Failed to submit bid');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" /></div>;
  if (!job) return <div className="text-center py-20 text-surface-700">Job not found</div>;

  const hasBid = job.bids?.some((b) => b.freelancerId === user?.id);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Badge status={job.status} />
              <span className="text-xs text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full">{job.category}</span>
            </div>
            <h1 className="text-2xl font-bold text-surface-900">{job.title}</h1>
            <p className="mt-4 text-surface-800 whitespace-pre-wrap">{job.description}</p>
            <div className="mt-6 flex flex-wrap gap-6 text-sm">
              <div><span className="text-surface-700">Budget:</span> <span className="font-semibold text-primary-400">{formatCurrency(job.budget)}</span></div>
              <div className="flex items-center gap-1"><Clock className="h-4 w-4 text-surface-600" /><span className="text-surface-700">Deadline:</span> {formatDate(job.deadline)}</div>
            </div>
            {job.client && (
              <div className="mt-6 flex items-center gap-3 border-t border-surface-300 pt-4">
                <Avatar name={job.client.name} src={job.client.avatar} />
                <div>
                  <Link to={`/users/${job.client.id}`} className="font-medium text-surface-900 hover:text-primary-400">{job.client.name}</Link>
                  <Rating rating={job.client.rating} size={14} showValue />
                </div>
              </div>
            )}
          </Card>

          {job.bids && job.bids.length > 0 && user?.role === 'CLIENT' && job.clientId === user.id && (
            <Card>
              <h2 className="text-lg font-semibold mb-4">Received Bids ({job.bids.length})</h2>
              <div className="space-y-4">
                {job.bids.map((bid) => (
                  <div key={bid.id} className="border border-surface-300 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {bid.freelancer && <Avatar name={bid.freelancer.name} src={bid.freelancer.avatar} />}
                        <div>
                          <p className="font-medium">{bid.freelancer?.name}</p>
                          <Rating rating={bid.freelancer?.rating ?? 0} size={14} />
                        </div>
                      </div>
                      <Badge status={bid.status} />
                    </div>
                    <p className="mt-3 text-sm text-surface-800">{bid.proposal}</p>
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <span className="font-semibold text-primary-400">{formatCurrency(bid.quote)}</span>
                      <span>{bid.deliveryDays} days delivery</span>
                    </div>
                    {bid.status === 'PENDING' && (
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" onClick={async () => {
                          await bidApi.accept(bid.id);
                          toast.success('Bid accepted!');
                          const { data } = await jobApi.getById(id!);
                          setJob(data);
                        }}>Accept</Button>
                        <Button size="sm" variant="outline" onClick={async () => {
                          await bidApi.reject(bid.id);
                          toast.success('Bid rejected');
                          const { data } = await jobApi.getById(id!);
                          setJob(data);
                        }}>Reject</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div>
          {user?.role === 'FREELANCER' && job.status === 'OPEN' && !hasBid && (
            <Card>
              <h2 className="text-lg font-semibold mb-4">Submit Your Bid</h2>
              {suggestion && (
                <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-center gap-2 text-purple-700 text-sm font-medium mb-2">
                    <Sparkles className="h-4 w-4" /> AI Bid Assistant
                  </div>
                  <p className="text-xs text-purple-600">Suggested: {formatCurrency(suggestion.suggestedQuote)} in {suggestion.suggestedDeliveryDays} days</p>
                </div>
              )}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-800 mb-1">Proposal</label>
                  <textarea {...register('proposal', { required: true })} rows={6} className="w-full rounded-lg border border-surface-400 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
                </div>
                <Input label="Your Quote ($)" type="number" step="0.01" {...register('quote', { required: true })} />
                <Input label="Delivery Days" type="number" {...register('deliveryDays', { required: true })} />
                <Button type="submit" className="w-full" loading={submitting}>Submit Bid</Button>
              </form>
            </Card>
          )}
          {hasBid && <Card><p className="text-sm text-green-600 font-medium">You have already submitted a bid for this job.</p></Card>}
        </div>
      </div>
    </div>
  );
}
