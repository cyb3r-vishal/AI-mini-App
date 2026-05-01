import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
  [
    'inline-flex items-center gap-1 rounded-block border-3 px-2 py-0.5',
    'text-2xs font-semibold uppercase tracking-wider',
  ],
  {
    variants: {
      tone: {
        neutral: 'bg-paper-100 text-paper-800 border-paper-300',
        brand: 'bg-brand-100 text-brand-800 border-brand-400',
        sky: 'bg-sky-100 text-sky-800 border-sky-400',
        sun: 'bg-sun-100 text-paper-800 border-sun-400',
        ember: 'bg-ember-100 text-ember-600 border-ember-300',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
