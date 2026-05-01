'use client';

import type { CellRenderer } from '../cell.types';

/** Fallback: safely stringifies anything without crashing. */
export const UnknownCell: CellRenderer = ({ value }) => {
  if (value === undefined || value === null) {
    return <span className="text-paper-400">—</span>;
  }
  let str: string;
  try {
    str = typeof value === 'string' ? value : JSON.stringify(value);
  } catch {
    str = '[unserializable]';
  }
  return (
    <span className="truncate text-paper-700" title={str}>
      {str.length > 60 ? `${str.slice(0, 60)}…` : str}
    </span>
  );
};
