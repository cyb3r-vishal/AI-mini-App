'use client';

import type { CellRenderer } from '../cell.types';
import { Badge } from '@/components/ui';

export const BooleanCell: CellRenderer = ({ value }) => {
  if (value === undefined || value === null) {
    return <span className="text-paper-400">—</span>;
  }
  return value ? <Badge tone="brand">Yes</Badge> : <Badge>No</Badge>;
};
