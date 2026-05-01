'use client';

import type { CellRenderer } from '../cell.types';

/** Handles: string | email | url | text — plus anything that looks like a string. */
export const TextCell: CellRenderer = ({ field, value }) => {
  if (value === undefined || value === null || value === '') {
    return <span className="text-paper-400">—</span>;
  }
  const str = typeof value === 'string' ? value : String(value);

  if (field.type === 'email') {
    return (
      <a href={`mailto:${str}`} className="text-sky-600 hover:underline">
        {str}
      </a>
    );
  }
  if (field.type === 'url') {
    return (
      <a
        href={str}
        target="_blank"
        rel="noreferrer noopener"
        className="text-sky-600 hover:underline"
      >
        {str}
      </a>
    );
  }
  if (field.type === 'text') {
    return <span className="line-clamp-2 whitespace-pre-line">{str}</span>;
  }
  return <span className="truncate">{str}</span>;
};
