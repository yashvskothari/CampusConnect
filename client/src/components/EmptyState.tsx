import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-surface-200 p-4 mb-4">
        <Inbox className="h-8 w-8 text-surface-600" />
      </div>
      <h3 className="text-lg font-semibold text-surface-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-surface-700 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
