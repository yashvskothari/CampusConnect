import { cn } from '../utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className, hover }: CardProps) {
  return (
    <div className={cn(
      'rounded-xl border border-surface-300 bg-surface-100 p-6 shadow-sm',
      hover && 'transition-all hover:shadow-md hover:border-primary-500/50',
      className
    )}>
      {children}
    </div>
  );
}
