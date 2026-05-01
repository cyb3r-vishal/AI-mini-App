import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/**
 * <Card /> — a chunky block surface with a solid drop shadow.
 *
 * Composition:
 *   <Card>
 *     <CardHeader>
 *       <CardTitle>…</CardTitle>
 *       <CardDescription>…</CardDescription>
 *     </CardHeader>
 *     <CardBody>…</CardBody>
 *     <CardFooter>…</CardFooter>
 *   </Card>
 */
const cardVariants = cva(
  [
    'relative bg-white text-paper-900',
    'rounded-block-lg border-3 border-paper-700',
  ],
  {
    variants: {
      tone: {
        default: 'bg-white',
        sunken: 'bg-paper-50',
        brand: 'bg-brand-50 border-brand-700',
        sky: 'bg-sky-50 border-sky-700',
        sun: 'bg-sun-50 border-sun-500',
        ember: 'bg-ember-50 border-ember-500',
      },
      elevation: {
        flat: 'shadow-none',
        block: 'shadow-block',
        lifted: 'shadow-block-lg',
      },
      interactive: {
        true:
          'transition-[transform,box-shadow] duration-100 hover:-translate-y-0.5 hover:shadow-block-lg active:translate-y-0.5 active:shadow-block-sm',
        false: '',
      },
    },
    defaultVariants: {
      tone: 'default',
      elevation: 'block',
      interactive: false,
    },
  },
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  as?: React.ElementType;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, tone, elevation, interactive, as: Comp = 'div', ...props }, ref) => (
    <Comp
      ref={ref}
      className={cn(cardVariants({ tone, elevation, interactive }), className)}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col gap-1 border-b-3 border-paper-200 px-5 py-4 sm:px-6 sm:py-5',
      className,
    )}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold tracking-tight text-paper-900', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-paper-600', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

export const CardBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('px-5 py-4 sm:px-6 sm:py-5', className)} {...props} />
));
CardBody.displayName = 'CardBody';

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center justify-end gap-3 border-t-3 border-paper-200 px-5 py-4 sm:px-6 sm:py-4',
      className,
    )}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';
