import { cn } from '../utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export default function Select({ label, className, id, children, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="space-y-1">
      {label && <label htmlFor={selectId} className="block text-sm font-medium text-surface-800">{label}</label>}
      <select
        id={selectId}
        className={cn(
          'w-full rounded-lg border border-surface-400 bg-surface-200 px-3 py-2 text-sm text-surface-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
