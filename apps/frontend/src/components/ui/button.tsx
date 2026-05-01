import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/**
 * <Button />
 *
 * The signature BlockKit component: a chunky, blocky rectangle with a
 * solid offset drop-shadow that "presses in" on click. Works as a button
 * or, via `asChild`-style composition, can wrap other interactive nodes.
 *
 * Variants: primary | secondary | outline | ghost | danger
 * Sizes:    sm | md | lg | icon
 */
const buttonVariants = cva(
  [
    // layout
    'inline-flex items-center justify-center gap-2 whitespace-nowrap select-none',
    // shape — blocky, not pill
    'rounded-block border-3',
    // typography
    'font-semibold tracking-tight',
    // motion
    'transition-[transform,box-shadow,background-color,border-color] duration-100',
    'active:translate-y-[2px] active:shadow-block-sm',
    // focus
    'focus-visible:outline-none',
    // disabled
    'disabled:pointer-events-none disabled:opacity-60 disabled:shadow-none disabled:translate-y-0',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-brand-400 text-paper-900 border-brand-700',
          'shadow-block hover:bg-brand-300',
          'focus-visible:shadow-focus',
        ],
        secondary: [
          'bg-paper-100 text-paper-800 border-paper-700',
          'shadow-block hover:bg-paper-200',
          'focus-visible:shadow-[0_0_0_3px_rgba(60,59,47,0.25)]',
        ],
        outline: [
          'bg-white text-paper-800 border-paper-700',
          'shadow-block-sm hover:bg-paper-50',
          'focus-visible:shadow-[0_0_0_3px_rgba(60,59,47,0.2)]',
        ],
        ghost: [
          'bg-transparent text-paper-800 border-transparent shadow-none',
          'hover:bg-paper-100 active:translate-y-0',
        ],
        danger: [
          'bg-ember-400 text-white border-ember-600',
          'shadow-block hover:bg-ember-300',
          'focus-visible:shadow-focus-ember',
        ],
        sky: [
          'bg-sky-400 text-white border-sky-700',
          'shadow-block hover:bg-sky-300',
          'focus-visible:shadow-focus-sky',
        ],
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4 text-[0.95rem]',
        lg: 'h-13 px-6 text-base',
        icon: 'h-11 w-11 p-0',
      },
      block: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      block: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render a loading spinner + disable interaction. */
  loading?: boolean;
  /** Icon on the left (rendered as-is). */
  leftIcon?: React.ReactNode;
  /** Icon on the right. */
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, block, loading, leftIcon, rightIcon, children, disabled, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={props.type ?? 'button'}
        disabled={disabled || loading}
        data-loading={loading ? '' : undefined}
        className={cn(buttonVariants({ variant, size, block }), className)}
        {...props}
      >
        {loading ? (
          <Spinner className="h-4 w-4" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        {children && <span className="inline-flex">{children}</span>}
        {!loading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  },
);
Button.displayName = 'Button';

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="square"
      />
    </svg>
  );
}

export { buttonVariants };
