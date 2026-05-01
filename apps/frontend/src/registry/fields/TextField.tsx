'use client';

import type { FieldRenderer } from '../field.types';
import { Input } from '@/components/ui';

/**
 * Renders: string | email | url fields.
 * One file per family — branch on `field.type` for per-variant tweaks.
 */
export const TextField: FieldRenderer = ({ field, value, onChange, onBlur, error, disabled, id, autoFocus }) => {
  const inputType =
    field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text';

  return (
    <Input
      id={id}
      type={inputType}
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value || undefined)}
      onBlur={onBlur}
      disabled={disabled}
      autoFocus={autoFocus}
      invalid={!!error}
      placeholder={field.label ?? field.key}
    />
  );
};
