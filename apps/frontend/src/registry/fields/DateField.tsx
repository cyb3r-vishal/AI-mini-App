'use client';

import type { FieldRenderer } from '../field.types';
import { Input } from '@/components/ui';

export const DateField: FieldRenderer = ({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  id,
  autoFocus,
}) => {
  const inputType = field.type === 'datetime' ? 'datetime-local' : 'date';
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
    />
  );
};
