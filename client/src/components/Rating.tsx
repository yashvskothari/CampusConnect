import { Star } from 'lucide-react';
import { cn } from '../utils';

interface RatingProps {
  rating: number;
  size?: number;
  showValue?: boolean;
}

export default function Rating({ rating, size = 16, showValue }: RatingProps) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={cn(
            star <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-surface-500'
          )}
        />
      ))}
      {showValue && <span className="text-sm text-surface-800 ml-1">{rating.toFixed(1)}</span>}
    </div>
  );
}
