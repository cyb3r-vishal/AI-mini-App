'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';
import { Label } from './label';

/**
 * Form primitives.
 *
 * Design goals:
 *  - Zero dependencies on a specific form library (works with plain <form>,
 *    react-hook-form, Formik, etc.).
 *  - Accessible by default: <FormField /> wires up htmlFor / aria-describedby.
 *  - Composable: render any input-like child inside <FormField />.
 */

// ---------------------------------------------------------------------------
// <Form />
// ---------------------------------------------------------------------------

export const Form = React.forwardRef<HTMLFormElement, React.FormHTMLAttributes<HTMLFormElement>>(
  ({ className, ...props }, ref) => (
    <form
      ref={ref}
      className={cn('flex flex-col gap-5', className)}
      noValidate
      {...props}
    />
  ),
);
Form.displayName = 'Form';

// ---------------------------------------------------------------------------
// <FormSection />
// ---------------------------------------------------------------------------

export interface FormSectionProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
}

export function FormSection({
  className,
  title,
  description,
  children,
  ...props
}: FormSectionProps) {
  return (
    <section className={cn('flex flex-col gap-4', className)} {...props}>
      {(title || description) && (
        <header className="flex flex-col gap-1">
          {title && <h2 className="text-base font-semibold tracking-tight">{title}</h2>}
          {description && <p className="text-sm text-paper-600">{description}</p>}
        </header>
      )}
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// <FormRow /> — 1/2/3-col responsive layout helper
// ---------------------------------------------------------------------------

export function FormRow({
  cols = 2,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { cols?: 1 | 2 | 3 }) {
  return (
    <div
      className={cn(
        'grid gap-4',
        cols === 1 && 'grid-cols-1',
        cols === 2 && 'grid-cols-1 sm:grid-cols-2',
        cols === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// <FormField /> — label + control + hint/error
// ---------------------------------------------------------------------------

interface FormFieldContextValue {
  id: string;
  descriptionId: string;
  errorId: string;
  invalid: boolean;
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

export function useFormField(): FormFieldContextValue {
  const ctx = React.useContext(FormFieldContext);
  if (!ctx) throw new Error('useFormField must be used within <FormField>');
  return ctx;
}

export interface FormFieldProps {
  label?: React.ReactNode;
  /** Small muted hint under the control. */
  hint?: React.ReactNode;
  /** Error message — replaces the hint when present. */
  error?: React.ReactNode;
  required?: boolean;
  /** Optional explicit id. Auto-generated otherwise. */
  id?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  hint,
  error,
  required,
  id: idProp,
  className,
  children,
}: FormFieldProps) {
  const reactId = React.useId();
  const id = idProp ?? `fld-${reactId}`;
  const descriptionId = `${id}-desc`;
  const errorId = `${id}-err`;
  const invalid = !!error;

  const ctx: FormFieldContextValue = { id, descriptionId, errorId, invalid };

  // Inject id / aria-* into the first valid element child.
  const child = React.Children.only(children) as React.ReactElement;
  const describedBy =
    [error ? errorId : null, hint && !error ? descriptionId : null].filter(Boolean).join(' ') ||
    undefined;

  const mergedChild = React.cloneElement(child, {
    id,
    'aria-invalid': invalid || undefined,
    'aria-describedby': describedBy,
    invalid,
  } as React.Attributes & Record<string, unknown>);

  return (
    <FormFieldContext.Provider value={ctx}>
      <div className={cn('flex flex-col gap-1.5', className)}>
        {label && (
          <Label htmlFor={id} required={required}>
            {label}
          </Label>
        )}
        {mergedChild}
        {error ? (
          <p id={errorId} role="alert" className="text-sm font-medium text-ember-600">
            {error}
          </p>
        ) : hint ? (
          <p id={descriptionId} className="text-xs text-paper-500">
            {hint}
          </p>
        ) : null}
      </div>
    </FormFieldContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// <FormActions /> — right-aligned button row
// ---------------------------------------------------------------------------

export function FormActions({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse items-stretch gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
