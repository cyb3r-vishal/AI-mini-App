import * as React from 'react';
import { cn } from '@/lib/cn';

/**
 * <Skeleton /> — blocky shimmer placeholder.
 *
 * Use directly for ad-hoc placeholders, or compose with <SkeletonText />
 * and <SkeletonBlock /> helpers below for common shapes.
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Disable the animation (useful for reduced-motion contexts). */
  still?: boolean;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, still, ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        'block rounded-block-sm bg-paper-200',
        !still && 'animate-pulse',
        className,
      )}
      {...props}
    />
  ),
);
Skeleton.displayName = 'Skeleton';

/** Multiple fake text lines of varying widths. */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  // Deterministic pseudo-widths so SSR + client match.
  const widths = ['92%', '100%', '88%', '95%', '80%', '70%', '98%'];
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-3" style={{ width: widths[i % widths.length] }} />
      ))}
    </div>
  );
}

/** Chunky block — good for avatars, buttons, cards. */
export function SkeletonBlock({ className }: { className?: string }) {
  return <Skeleton className={cn('h-20 w-full rounded-block', className)} />;
}
