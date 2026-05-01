'use client';

import type { Field } from '@ai-gen/shared';
import { cellRegistry } from './cell-registry';

/**
 * <CellRenderer /> — look up the right cell component by field type.
 * Always renders; never crashes.
 */
export interface CellRendererHostProps {
  field: Field;
  value: unknown;
  row: Record<string, unknown>;
}

export function CellRenderer({ field, value, row }: CellRendererHostProps) {
  const Component = cellRegistry.resolve(field.type);
  return <Component field={field} value={value} row={row} />;
}
