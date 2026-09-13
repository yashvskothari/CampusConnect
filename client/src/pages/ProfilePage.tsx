import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  const { user: currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<(User & { services?: unknown[]; reviewsReceived?: Review[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm<{ rating: string; comment: string }>();

  const profileId = id || currentUser?.id;

  useEffect(() => {
    if (!profileId) return;
    userApi.getById(profileId).then(({ data }) => setProfile(data)).catch(() => toast.error('Profile not found')).finally(() => setLoading(false));
  }, [profileId]);

  const openDeletePasswordPrompt = () => {
    setShowDeleteConfirmation(false);
    setDeletePassword('');
    setShowDeletePassword(true);
  };

  const deleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Please enter your password');
      return;
    }

    setDeleteLoading(true);
    try {
      await userApi.deleteAccount(deletePassword);
      toast.success('Your account has been permanently deleted.');
      logout();
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Failed to delete account');
    } finally {
      setDeleteLoading(false);
    }
  };

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

      {isOwnProfile && (
        <Card className="mt-8 border border-red-500/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-surface-900">Delete Account</h2>
              <p className="mt-1 text-sm text-surface-700">
                Permanently delete your Gigverse account and all associated data. This action cannot be undone.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="danger"
              onClick={() => setShowDeleteConfirmation(true)}
            >
              Delete Account Permanently
            </Button>
          </div>
        </Card>
      )}

      {showDeleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-surface-400 bg-surface-100 p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-surface-900">Delete your account?</h2>
            <p className="mt-3 text-sm leading-6 text-surface-700">
              This will permanently delete your profile, services, jobs, bids, messages, reviews, and other account data.
              You will not be able to recover your account afterward.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setShowDeleteConfirmation(false)}>
                Cancel
              </Button>
              <Button type="button" variant="danger" onClick={openDeletePasswordPrompt}>
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeletePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-surface-400 bg-surface-100 p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-surface-900">Confirm account deletion</h2>
            <p className="mt-3 text-sm text-surface-700">
              For your security, enter your current password to permanently delete your account.
            </p>
            <label htmlFor="delete-account-password" className="mt-5 block text-sm font-medium text-surface-900">
              Password
            </label>
            <input
              id="delete-account-password"
              type="password"
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !deleteLoading) deleteAccount();
              }}
              autoComplete="current-password"
              autoFocus
              placeholder="Enter your password"
              className="mt-2 w-full rounded-lg border border-surface-400 bg-surface-0 px-3 py-2.5 text-sm text-surface-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={deleteLoading}
                onClick={() => {
                  setShowDeletePassword(false);
                  setDeletePassword('');
                }}
              >
                Cancel
              </Button>
              <Button type="button" variant="danger" loading={deleteLoading} onClick={deleteAccount}>
                Permanently Delete
              </Button>
            </div>
          </div>
        </div>
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
