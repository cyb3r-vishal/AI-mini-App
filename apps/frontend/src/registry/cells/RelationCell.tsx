'use client';

import type { CellRenderer } from '../cell.types';

/**
 * Relation cell. Until we have a related-record loader, render the id(s)
 * as a truncated mono string.
 */
export const RelationCell: CellRenderer = ({ field, value }) => {
  if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
    return <span className="text-paper-400">—</span>;
  }
  const target = field.type === 'relation' ? field.entity : '';
  if (Array.isArray(value)) {
    return (
      <span className="truncate font-mono text-xs text-paper-600" title={`${target}: ${value.join(', ')}`}>
        {value.length} × {target}
      </span>
    );
  }
  return (
    <span className="truncate font-mono text-xs text-paper-600" title={`${target}: ${String(value)}`}>
      {String(value).slice(0, 10)}…
    </span>
  );
};
