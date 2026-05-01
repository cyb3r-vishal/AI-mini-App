'use client';

import type { FieldRenderer } from '../field.types';

export const BooleanField: FieldRenderer = ({ field, value, onChange, disabled, id }) => {
  const checked = value === true;
  return (
    <label
      htmlFor={id}
      className="inline-flex cursor-pointer items-center gap-3 select-none"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 cursor-pointer rounded-block border-3 border-paper-700 bg-white accent-brand-500 shadow-block-sm focus:outline-none focus:shadow-focus"
      />
      <span className="text-sm text-paper-800">{field.label ?? field.key}</span>
    </label>
  );
};
