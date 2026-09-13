import { cn, getInitials } from '../utils';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  editable?: boolean;
  onEdit?: () => void;
}

export default function Avatar({
  name,
  src,
  size = 'md',
  className,
  editable = false,
  onEdit,
}: AvatarProps) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-xl',
  };

  const avatar = src ? (
    <img
      src={src}
      alt={name}
      className={cn(
        'block rounded-full object-cover',
        sizes[size],
        className
      )}
    />
  ) : (
    <div
      className={cn(
        'flex items-center justify-center rounded-full',
        'bg-primary-500/15 text-primary-300',
        'font-semibold',
        sizes[size],
        textSizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );

  if (!editable) {
    return avatar;
  }

  return (
    <div
      className={cn(
        'group relative inline-block shrink-0',
        sizes[size]
      )}
    >
      {avatar}

      <button
        type="button"
        onClick={onEdit}
        aria-label="Edit profile picture"
        title="Edit profile picture"
        className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/50 group-hover:opacity-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-white drop-shadow-md"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>
    </div>
  );
}