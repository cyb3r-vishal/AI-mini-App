import { createRegistry } from './create-registry';
import type { FieldRenderer } from './field.types';

import { TextField } from './fields/TextField';
import { TextareaField } from './fields/TextareaField';
import { NumberField } from './fields/NumberField';
import { BooleanField } from './fields/BooleanField';
import { DateField } from './fields/DateField';
import { SelectField } from './fields/SelectField';
import { MultiSelectField } from './fields/MultiSelectField';
import { RelationField } from './fields/RelationField';
import { JsonField } from './fields/JsonField';
import { UnknownField } from './fields/UnknownField';

/**
 * Field registry.
 *
 * Keys match `Field["type"]`. Add a new field type by calling:
 *
 *   import { fieldRegistry } from '@/registry/field-registry';
 *   fieldRegistry.register('color', MyColorField);
 *
 * That's it. Everywhere rendering happens (FieldRenderer / FormPage / …)
 * uses `resolve()` so the new type works immediately.
 */
export const fieldRegistry = createRegistry<FieldRenderer>({
  name: 'field',
  fallback: UnknownField,
  entries: {
    // string-ish
    string: TextField,
    email: TextField,
    url: TextField,
    // long text
    text: TextareaField,
    // primitives
    number: NumberField,
    boolean: BooleanField,
    date: DateField,
    datetime: DateField,
    // choices
    select: SelectField,
    multiselect: MultiSelectField,
    // references
    relation: RelationField,
    // blob
    json: JsonField,
  },
});
