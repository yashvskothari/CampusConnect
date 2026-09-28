import { cn } from '../utils';

const variants: Record<string, string> = {
  OPEN: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-surface-200 text-surface-800',
  CANCELLED: 'bg-red-100 text-red-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  FAILED: 'bg-red-100 text-red-700',
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-red-100 text-red-700',
  CLIENT: 'bg-teal-100 text-teal-700',
  FREELANCER: 'bg-blue-100 text-blue-700',
  ADMIN: 'bg-amber-100 text-amber-700',
};

export default function Badge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[status] || 'bg-surface-200 text-surface-800', className)}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
