'use client';

import type { FieldRenderer } from '../field.types';
import { Input } from '@/components/ui';

export const NumberField: FieldRenderer = ({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  id,
  autoFocus,
}) => {
  const min = field.type === 'number' ? field.min : undefined;
  const max = field.type === 'number' ? field.max : undefined;
  const step = field.type === 'number' ? field.step : undefined;

  return (
    <Input
      id={id}
      type="number"
      value={typeof value === 'number' ? value : value === undefined || value === null ? '' : Number(value)}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === '') return onChange(undefined);
        const n = Number(raw);
        if (!Number.isFinite(n)) return onChange(undefined);
        onChange(n);
      }}
      onBlur={onBlur}
      disabled={disabled}
      autoFocus={autoFocus}
      invalid={!!error}
      min={min}
      max={max}
      step={step}
    />
  );
};
