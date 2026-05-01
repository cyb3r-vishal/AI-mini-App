import * as React from 'react';
import { Button } from './button';
import { cn } from '@/lib/cn';

/**
 * <ErrorState /> — blocky ember-toned callout for failures, with an optional retry.
 */
export interface ErrorStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  message?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  /** Compact inline version (used inside tables / cards). */
  inline?: boolean;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
  inline,
  className,
  ...props
}: ErrorStateProps) {
  if (inline) {
    return (
      <div
        role="alert"
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-block border-3 border-ember-300 bg-ember-50 px-4 py-6 text-center',
          className,
        )}
        {...props}
      >
        <ErrorIcon />
        <p className="text-sm font-medium text-ember-600">{title}</p>
        {message && <p className="text-xs text-paper-600">{message}</p>}
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-block-lg border-3 border-ember-300 bg-ember-50 px-6 py-10 text-center sm:py-14',
        className,
      )}
      {...props}
    >
      <ErrorIcon large />
      <div className="flex flex-col gap-1">
        <p className="font-display text-base text-ember-600 sm:text-lg">{title}</p>
        {message && (
          <p className="max-w-prose text-sm text-paper-700">{message}</p>
        )}
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-1">
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

function ErrorIcon({ large }: { large?: boolean }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={large ? 'h-10 w-10 text-ember-500' : 'h-6 w-6 text-ember-500'}
      aria-hidden
      fill="none"
      style={{ shapeRendering: 'crispEdges' }}
    >
      <path
        d="M16 4 4 26h24z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect x="15" y="12" width="2" height="8" fill="currentColor" />
      <rect x="15" y="22" width="2" height="2" fill="currentColor" />
    </svg>
  );
}
