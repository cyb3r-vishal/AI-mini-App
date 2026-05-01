'use client';

import type { CellRenderer } from '../cell.types';

export const DateCell: CellRenderer = ({ field, value }) => {
  if (value === undefined || value === null || value === '') {
    return <span className="text-paper-400">—</span>;
  }
  const str = typeof value === 'string' ? value : String(value);
  const date = new Date(str);
  if (Number.isNaN(date.getTime())) {
    return <span className="text-paper-400">—</span>;
  }
  const showTime = field.type === 'datetime';
  return (
    <time dateTime={date.toISOString()} className="tabular-nums">
      {showTime ? date.toLocaleString() : date.toLocaleDateString()}
    </time>
  );
};
