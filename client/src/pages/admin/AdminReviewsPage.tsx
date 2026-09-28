import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import Card from '../../components/Card';
import Rating from '../../components/Rating';
import Select from '../../components/Select';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';
import { adminApi } from '../../services';
import { formatDate, getErrorMessage } from '../../utils';
import type { AdminReview } from '../../types';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [maxRating, setMaxRating] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  const [deleteTarget, setDeleteTarget] = useState<AdminReview | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getReviews({ page, limit: 20, ...(maxRating && { maxRating }) })
      .then(({ data }) => { if (!cancelled) { setReviews(data.data); setPagination(data.pagination); } })
      .catch(() => !cancelled && toast.error('Failed to load reviews'));
    return () => { cancelled = true; };
  }, [page, maxRating, reloadKey]);

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteReview(deleteTarget.id);
      toast.success('Review removed');
      setDeleteTarget(null);
      reload();
    } catch (err) { toast.error(getErrorMessage(err, 'Failed to delete review')); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Reviews</h1>
        <p className="text-surface-700">Remove abusive reviews. The user's average rating is recalculated automatically.</p>
      </div>

      <Card className="p-4">
        <div className="max-w-xs">
          <Select aria-label="Filter by rating" value={maxRating} onChange={(e) => { setMaxRating(e.target.value); setPage(1); }}>
            <option value="">All ratings</option>
            <option value="2">2 stars and below</option>
            <option value="3">3 stars and below</option>
          </Select>
        </div>
      </Card>

      {reviews.length === 0 ? (
        <Card><EmptyState title="No reviews found" /></Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Rating rating={r.rating} />
                  <p className="mt-2 text-sm text-surface-900 break-words">{r.comment}</p>
                  <p className="mt-2 text-xs text-surface-700">
                    {r.reviewer?.name} → {r.reviewee?.name} · {formatDate(r.createdAt)}
                  </p>
                </div>
                <button
                  title="Delete review" aria-label="Delete review" onClick={() => setDeleteTarget(r)}
                  className="shrink-0 rounded-lg p-1.5 text-surface-700 hover:bg-surface-300 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onChange={setPage} />

      <ConfirmModal
        open={!!deleteTarget} title="Delete review" confirmLabel="Delete" danger
        message="This review will be permanently removed and the reviewed user's rating recalculated."
        onConfirm={doDelete} onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
