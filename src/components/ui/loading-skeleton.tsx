// components/ui/loading-skeleton.tsx
import { cn } from '@/lib/utils'; // Assuming you have a cn utility for class merging

interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number;
  variant?: 'card' | 'list' | 'text';
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export default function LoadingSkeleton({
  className,
  rows = 1,
  variant = 'card',
  rounded = 'md',
  ...props
}: LoadingSkeletonProps) {
  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  if (variant === 'card') {
    return (
      <div
        className={cn(
          'animate-pulse bg-gray-200 dark:bg-gray-700',
          roundedClasses[rounded],
          className
        )}
        {...props}
      />
    );
  }

  if (variant === 'list') {
    return (
      <div className="space-y-4" {...props}>
        {[...Array(rows)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'animate-pulse h-16 bg-gray-200 dark:bg-gray-700',
              roundedClasses[rounded]
            )}
          />
        ))}
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className="space-y-2" {...props}>
        {[...Array(rows)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'animate-pulse h-4 bg-gray-200 dark:bg-gray-700',
              roundedClasses[rounded],
              i === rows - 1 ? 'w-3/4' : 'w-full'
            )}
          />
        ))}
      </div>
    );
  }

  return null;
}