'use client';

import type { FieldRenderer } from '../field.types';
import { Input } from '@/components/ui';

/**
 * Placeholder: a record-id input. Once the runtime has a loader for related
 * records it will be swapped for a searchable picker via `register()`.
 */
export const RelationField: FieldRenderer = ({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  id,
  autoFocus,
}) => {
  const cardinality = field.type === 'relation' ? field.cardinality : 'one';
  const target = field.type === 'relation' ? field.entity : '…';

  if (cardinality === 'many') {
    const current = Array.isArray(value) ? (value as string[]).join(', ') : '';
    return (
      <Input
        id={id}
        value={current}
        onChange={(e) => {
          const parts = e.target.value
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          onChange(parts.length ? parts : undefined);
        }}
        onBlur={onBlur}
        disabled={disabled}
        autoFocus={autoFocus}
        invalid={!!error}
        placeholder={`${target} ids, comma-separated`}
      />
    );
  }

  return (
    <Input
      id={id}
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value || undefined)}
      onBlur={onBlur}
      disabled={disabled}
      autoFocus={autoFocus}
      invalid={!!error}
      placeholder={`${target} id`}
    />
  );
};
