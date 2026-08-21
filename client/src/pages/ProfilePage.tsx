import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import Rating from '../components/Rating';
import Button from '../components/Button';
import { userApi, reviewApi } from '../services';
import { useAuth } from '../context/AuthContext';
import type { User, Review } from '../types';

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<(User & { services?: unknown[]; reviewsReceived?: Review[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const { register, handleSubmit, reset } = useForm<{ rating: string; comment: string }>();

  const profileId = id || currentUser?.id;

  useEffect(() => {
    if (!profileId) return;
    userApi.getById(profileId).then(({ data }) => setProfile(data)).catch(() => toast.error('Profile not found')).finally(() => setLoading(false));
  }, [profileId]);

  const onReview = async (data: { rating: string; comment: string }) => {
    if (!profileId) return;
    try {
      await reviewApi.create({ revieweeId: profileId, rating: Number(data.rating), comment: data.comment });
      toast.success('Review submitted!');
      setShowReview(false);
      reset();
      const { data: updated } = await userApi.getById(profileId);
      setProfile(updated);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Failed to submit review');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" /></div>;
  if (!profile) return <div className="text-center py-20">Profile not found</div>;

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <Avatar name={profile.name} src={profile.avatar} size="lg" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-surface-900">{profile.name}</h1>
            <p className="text-sm text-primary-400 capitalize">{profile.role.toLowerCase()}</p>
            <Rating rating={profile.rating} size={18} showValue />
            {profile.bio && <p className="mt-3 text-surface-800">{profile.bio}</p>}
            {profile.skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span key={skill} className="rounded-full bg-primary-500/10 px-3 py-1 text-xs font-medium text-primary-300">{skill}</span>
                ))}
              </div>
            )}
            {!isOwnProfile && currentUser && (
              <div className="mt-4 flex gap-2">
                <Link to={`/messages?user=${profile.id}`}><Button size="sm" variant="outline">Message</Button></Link>
                <Button size="sm" variant="secondary" onClick={() => setShowReview(!showReview)}>Leave Review</Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {showReview && (
        <Card className="mt-6">
          <h3 className="font-semibold mb-4">Write a Review</h3>
          <form onSubmit={handleSubmit(onReview)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Rating</label>
              <select {...register('rating')} className="rounded-lg border border-surface-400 px-3 py-2 text-sm">
                {[5,4,3,2,1].map((r) => <option key={r} value={r}>{r} Stars</option>)}
              </select>
            </div>
            <textarea {...register('comment', { required: true })} rows={3} placeholder="Share your experience..." className="w-full rounded-lg border border-surface-400 px-3 py-2 text-sm" />
            <Button type="submit" size="sm">Submit Review</Button>
          </form>
        </Card>
      )}

      {profile.reviewsReceived && profile.reviewsReceived.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Reviews</h2>
          <div className="space-y-4">
            {profile.reviewsReceived.map((review) => (
              <Card key={review.id}>
                <div className="flex items-center gap-3 mb-2">
                  {review.reviewer && <Avatar name={review.reviewer.name} src={review.reviewer.avatar} size="sm" />}
                  <div>
                    <p className="text-sm font-medium">{review.reviewer?.name}</p>
                    <Rating rating={review.rating} size={14} />
                  </div>
                </div>
                <p className="text-sm text-surface-800">{review.comment}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
