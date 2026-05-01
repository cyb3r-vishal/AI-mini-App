import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/**
 * Blocky input. Flat, deep-set look with a subtle inner shadow and a
 * solid border that switches to brand on focus.
 */
const inputVariants = cva(
  [
    'block w-full bg-white text-paper-900 placeholder:text-paper-500',
    'rounded-block border-3 border-paper-300',
    'shadow-inset',
    'transition-[border-color,box-shadow,background-color] duration-100',
    'focus:outline-none focus:border-brand-500 focus:shadow-focus',
    'disabled:cursor-not-allowed disabled:bg-paper-100 disabled:opacity-70',
    'aria-[invalid=true]:border-ember-500 aria-[invalid=true]:shadow-focus-ember',
  ],
  {
    variants: {
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-3.5 text-[0.95rem]',
        lg: 'h-13 px-4 text-base',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

type SizeProps = VariantProps<typeof inputVariants>;

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    SizeProps {
  invalid?: boolean;
  /** Optional element rendered inside the leading edge (e.g. an icon). */
  leading?: React.ReactNode;
  /** Optional element rendered inside the trailing edge. */
  trailing?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, invalid, leading, trailing, ...props }, ref) => {
    if (!leading && !trailing) {
      return (
        <input
          ref={ref}
          aria-invalid={invalid || undefined}
          className={cn(inputVariants({ size }), className)}
          {...props}
        />
      );
    }
    return (
      <div className="relative flex items-stretch">
        {leading && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-paper-500">
            {leading}
          </span>
        )}
        <input
          ref={ref}
          aria-invalid={invalid || undefined}
          className={cn(
            inputVariants({ size }),
            leading && 'pl-10',
            trailing && 'pr-10',
            className,
          )}
          {...props}
        />
        {trailing && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-paper-500">
            {trailing}
          </span>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';
