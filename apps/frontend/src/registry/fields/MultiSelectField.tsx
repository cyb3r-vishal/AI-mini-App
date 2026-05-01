'use client';

import type { FieldRenderer } from '../field.types';
import { cn } from '@/lib/cn';

/**
 * Multi-select rendered as a row of chunky togglable chips — more tactile
 * than a native multi-select and matches the BlockKit feel.
 */
export const MultiSelectField: FieldRenderer = ({ field, value, onChange, disabled, id }) => {
  const options = field.type === 'multiselect' ? field.options : [];
  const current: Array<string | number | boolean> = Array.isArray(value)
    ? (value as Array<string | number | boolean>)
    : [];

  const toggle = (v: string | number | boolean) => {
    const has = current.some((c) => c === v);
    const next = has ? current.filter((c) => c !== v) : [...current, v];
    onChange(next.length ? next : undefined);
  };

  return (
    <div id={id} role="group" className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = current.some((c) => c === o.value);
        return (
          <button
            key={String(o.value)}
            type="button"
            disabled={disabled}
            onClick={() => toggle(o.value)}
            aria-pressed={active}
            className={cn(
              'rounded-block border-3 px-3 py-1.5 text-sm font-medium transition-[background-color,border-color,box-shadow]',
              'focus:outline-none focus-visible:shadow-focus',
              active
                ? 'bg-brand-400 text-paper-900 border-brand-700 shadow-block-sm'
                : 'bg-white text-paper-800 border-paper-300 hover:bg-paper-50',
              disabled && 'pointer-events-none opacity-60',
            )}
          >
            {o.label ?? String(o.value)}
          </button>
        );
      })}
    </div>
  );
};
