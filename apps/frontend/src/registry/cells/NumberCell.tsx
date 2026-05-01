'use client';

import type { CellRenderer } from '../cell.types';

export const NumberCell: CellRenderer = ({ value }) => {
  if (value === undefined || value === null || value === '') {
    return <span className="text-paper-400">—</span>;
  }
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) {
    return <span className="text-paper-400">—</span>;
  }
  return <span className="tabular-nums">{n.toLocaleString()}</span>;
};
