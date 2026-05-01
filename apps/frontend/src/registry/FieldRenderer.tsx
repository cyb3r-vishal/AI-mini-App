'use client';

import type { Field } from '@ai-gen/shared';
import { FormField } from '@/components/ui';
import { fieldRegistry } from './field-registry';

/**
 * <FieldRenderer /> — drop-in for rendering a single config-defined field.
 * Looks up the registered component; always renders something.
 */
export interface FieldRendererShellProps {
  field: Field;
  value: unknown;
  onChange: (next: unknown) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  /** When true, wraps the control in <FormField> (label + error). Default true. */
  withLabel?: boolean;
  /** Optional explicit id. */
  id?: string;
  autoFocus?: boolean;
}

export function FieldRenderer({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  withLabel = true,
  id,
  autoFocus,
}: FieldRendererShellProps) {
  const Component = fieldRegistry.resolve(field.type);

  const control = (
    <Component
      field={field}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      error={error}
      disabled={disabled}
      id={id}
      autoFocus={autoFocus}
    />
  );

  if (!withLabel) return control;

  return (
    <FormField
      id={id}
      label={field.type === 'boolean' ? undefined : field.label ?? field.key}
      hint={field.description}
      error={error}
      required={field.required}
    >
      {control}
    </FormField>
  );
}
