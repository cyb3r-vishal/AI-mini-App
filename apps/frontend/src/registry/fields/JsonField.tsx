'use client';

import { useEffect, useState } from 'react';
import type { FieldRenderer } from '../field.types';
import { Textarea } from '@/components/ui';

/**
 * JSON blob editor with live parse validation. Stores the parsed value;
 * shows raw text while the user is editing invalid JSON.
 */
export const JsonField: FieldRenderer = ({ value, onChange, disabled, id, autoFocus }) => {
  const [raw, setRaw] = useState(() => (value === undefined ? '' : JSON.stringify(value, null, 2)));
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    // Keep text in sync when an external reset clears the value.
    if (value === undefined) setRaw('');
  }, [value]);

  return (
    <div className="flex flex-col gap-1.5">
      <Textarea
        id={id}
        rows={6}
        value={raw}
        disabled={disabled}
        autoFocus={autoFocus}
        invalid={!!localError}
        onChange={(e) => {
          const text = e.target.value;
          setRaw(text);
          if (text.trim() === '') {
            setLocalError(null);
            onChange(undefined);
            return;
          }
          try {
            const parsed = JSON.parse(text);
            setLocalError(null);
            onChange(parsed);
          } catch (err) {
            setLocalError(err instanceof Error ? err.message : 'Invalid JSON');
          }
        }}
        placeholder='{ "key": "value" }'
      />
      {localError && <p className="text-xs text-ember-600">{localError}</p>}
    </div>
  );
};
