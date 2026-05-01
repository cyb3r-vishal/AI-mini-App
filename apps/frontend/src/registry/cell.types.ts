import type { ComponentType } from 'react';
import type { Field } from '@ai-gen/shared';

/**
 * Cell renderer contract.
 *
 * Every cell component receives its field definition + the raw value for the
 * current row. It renders a read-only cell. Keep them pure, lightweight, and
 * deterministic — tables re-render a lot.
 */
export interface CellRendererProps<TField extends Field = Field> {
  field: TField;
  value: unknown;
  /** The full row — handy for composite cells (e.g. relation tooltips). */
  row: Record<string, unknown>;
}

export type CellRenderer<TField extends Field = Field> = ComponentType<CellRendererProps<TField>>;
