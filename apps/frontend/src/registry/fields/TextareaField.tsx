'use client';

import type { FieldRenderer } from '../field.types';
import { Textarea } from '@/components/ui';

export const TextareaField: FieldRenderer = ({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  id,
  autoFocus,
}) => (
  <Textarea
    id={id}
    value={typeof value === 'string' ? value : ''}
    onChange={(e) => onChange(e.target.value || undefined)}
    onBlur={onBlur}
    disabled={disabled}
    autoFocus={autoFocus}
    invalid={!!error}
    placeholder={field.label ?? field.key}
    maxLength={field.type === 'text' ? field.maxLength : undefined}
  />
);
