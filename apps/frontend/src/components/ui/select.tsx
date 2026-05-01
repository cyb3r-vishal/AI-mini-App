import * as React from 'react';
import { cn } from '@/lib/cn';

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  invalid?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses: Record<NonNullable<SelectProps['size']>, string> = {
  sm: 'h-9 pl-3 pr-9 text-sm',
  md: 'h-11 pl-3.5 pr-10 text-[0.95rem]',
  lg: 'h-13 pl-4 pr-11 text-base',
};

/**
 * Native select styled to match the rest of the kit. We keep it native for
 * accessibility and mobile UX; only the chrome is themed.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, size = 'md', children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          'block w-full appearance-none rounded-block border-3 border-paper-300 bg-white',
          'text-paper-900 shadow-inset transition-[border-color,box-shadow] duration-100',
          'focus:outline-none focus:border-brand-500 focus:shadow-focus',
          'disabled:cursor-not-allowed disabled:bg-paper-100 disabled:opacity-70',
          'aria-[invalid=true]:border-ember-500 aria-[invalid=true]:shadow-focus-ember',
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {/* Chevron */}
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-paper-600"
      >
        <path
          fill="currentColor"
          d="M10 13 5 8h10z"
          style={{ shapeRendering: 'crispEdges' }}
        />
      </svg>
    </div>
  ),
);
Select.displayName = 'Select';
