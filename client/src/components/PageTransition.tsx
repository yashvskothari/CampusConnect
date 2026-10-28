import { type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Animated route wrapper that renders smooth entrance transitions
 * whenever the website lands on a new page.
 */
export default function PageTransition({ children, className = '' }: PageTransitionProps) {
  const location = useLocation();

  return (
    <div
      key={location.pathname}
      className={`animate-page-enter w-full ${className}`}
    >
      {children}
    </div>
  );
}
