'use client';

import type { FieldRenderer } from '../field.types';
import { Select } from '@/components/ui';

/** Single-select field. Options come from `field.options`. */
export const SelectField: FieldRenderer = ({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  id,
  autoFocus,
}) => {
  const options = field.type === 'select' ? field.options : [];
  const current = value === undefined || value === null ? '' : String(value);

  return (
    <Select
      id={id}
      value={current}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === '') return onChange(undefined);
        // Preserve original option value type (string | number | boolean).
        const match = options.find((o) => String(o.value) === raw);
        onChange(match?.value ?? raw);
      }}
      onBlur={onBlur}
      disabled={disabled}
      autoFocus={autoFocus}
      invalid={!!error}
    >
      <option value="">— Select —</option>
      {options.map((o) => (
        <option key={String(o.value)} value={String(o.value)}>
          {o.label ?? String(o.value)}
        </option>
      ))}
    </Select>
  );
};
