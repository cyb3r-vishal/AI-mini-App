'use client';

import type { FieldRenderer } from '../field.types';
import { Input } from '@/components/ui';

/**
 * Fallback renderer used when a field's `type` has no registered component.
 * It renders a read-only text input and a warning so authors can spot the
 * missing integration without the page exploding.
 */
export const UnknownField: FieldRenderer = ({ field, value, id }) => (
  <div className="flex flex-col gap-1.5">
    <Input
      id={id}
      value={value === undefined || value === null ? '' : JSON.stringify(value)}
      readOnly
      invalid
      placeholder={`Unsupported field type: ${field.type}`}
    />
    <p className="text-xs text-ember-600">
      No renderer registered for field type <code>{field.type}</code>.
    </p>
  </div>
);
