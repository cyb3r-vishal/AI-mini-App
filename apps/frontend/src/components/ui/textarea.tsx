import * as React from 'react';
import { cn } from '@/lib/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, rows, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows ?? 4}
      aria-invalid={invalid || undefined}
      className={cn(
        'block w-full resize-y rounded-block border-3 border-paper-300 bg-white px-3.5 py-2.5 text-[0.95rem]',
        'text-paper-900 placeholder:text-paper-500 shadow-inset',
        'transition-[border-color,box-shadow] duration-100',
        'focus:outline-none focus:border-brand-500 focus:shadow-focus',
        'disabled:cursor-not-allowed disabled:bg-paper-100 disabled:opacity-70',
        'aria-[invalid=true]:border-ember-500 aria-[invalid=true]:shadow-focus-ember',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';
