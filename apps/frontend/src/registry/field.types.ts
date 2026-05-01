import type { ComponentType } from 'react';
import type { Field, FieldType } from '@ai-gen/shared';

/**
 * Field renderer contract.
 *
 * Every field component is a controlled-or-uncontrolled React component that:
 *   - receives its `Field` definition (from AppConfig),
 *   - receives `value`, `onChange`, plus optional `error` / `disabled`,
 *   - returns a rendered form control.
 *
 * TS note: we keep `value: unknown` at the boundary. Components narrow it
 * internally using their own `Field` branch (type = 'text' etc). This keeps
 * the registry map uniform while staying type-safe at the call sites.
 */
export interface FieldRendererProps<TField extends Field = Field> {
  field: TField;
  /** Current value. `undefined` = empty. */
  value: unknown;
  /** Change handler. `undefined` means the user cleared the field. */
  onChange: (next: unknown) => void;
  /** Optional blur handler — useful for react-hook-form bridges later. */
  onBlur?: () => void;
  /** Human-readable error (already localized). */
  error?: string;
  disabled?: boolean;
  /** DOM id to wire with labels/aria. */
  id?: string;
  /** Auto-focus on mount — honored by the form shell, not all fields. */
  autoFocus?: boolean;
}

export type FieldRenderer<TField extends Field = Field> = ComponentType<FieldRendererProps<TField>>;

/** Registry key is the `type` string on a Field. */
// The `(string & {})` idiom is intentional — it preserves literal-union
// autocomplete for `FieldType` while still accepting custom strings.
// eslint-disable-next-line @typescript-eslint/ban-types
export type FieldKey = FieldType | (string & {});
