'use client';

import type { CellRenderer } from '../cell.types';

export const JsonCell: CellRenderer = ({ value }) => {
  if (value === undefined || value === null) {
    return <span className="text-paper-400">—</span>;
  }
  try {
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    return (
      <code className="truncate font-mono text-xs text-paper-700" title={str}>
        {str.length > 40 ? `${str.slice(0, 40)}…` : str}
      </code>
    );
  } catch {
    return <span className="text-paper-400">—</span>;
  }
};
