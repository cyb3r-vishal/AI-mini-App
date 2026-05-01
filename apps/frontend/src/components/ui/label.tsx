import * as React from 'react';
import { cn } from '@/lib/cn';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Renders a subtle "required" marker. */
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 text-sm font-medium text-paper-700',
        className,
      )}
      {...props}
    >
      {children}
      {required && (
        <span aria-hidden className="text-ember-500">
          *
        </span>
      )}
    </label>
  ),
);
Label.displayName = 'Label';
