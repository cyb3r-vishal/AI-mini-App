import * as React from 'react';
import { cn } from '@/lib/cn';

/**
 * <EmptyState /> — friendly blocky placeholder for empty lists / tables.
 */
export interface EmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  tone?: 'neutral' | 'brand' | 'sun';
}

const toneClasses: Record<NonNullable<EmptyStateProps['tone']>, string> = {
  neutral: 'bg-paper-50 border-paper-300',
  brand: 'bg-brand-50 border-brand-400',
  sun: 'bg-sun-50 border-sun-400',
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  tone = 'neutral',
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-block-lg border-3 border-dashed px-6 py-10 text-center sm:py-14',
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {icon ?? <DefaultEmptyIcon />}
      <div className="flex flex-col gap-1">
        <p className="font-display text-base text-paper-900 sm:text-lg">{title}</p>
        {description && (
          <p className="max-w-prose text-sm text-paper-600">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

function DefaultEmptyIcon() {
  // Pixel-style box
  return (
    <svg
      viewBox="0 0 32 32"
      className="h-10 w-10 text-paper-400"
      aria-hidden
      fill="none"
      style={{ shapeRendering: 'crispEdges' }}
    >
      <path
        d="M6 10 16 4l10 6v12l-10 6-10-6V10z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M6 10 16 16l10-6M16 16v12" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
