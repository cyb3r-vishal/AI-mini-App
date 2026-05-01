import { createRegistry } from './create-registry';
import type { CellRenderer } from './cell.types';

import { TextCell } from './cells/TextCell';
import { NumberCell } from './cells/NumberCell';
import { BooleanCell } from './cells/BooleanCell';
import { DateCell } from './cells/DateCell';
import { SelectCell, MultiSelectCell } from './cells/SelectCell';
import { RelationCell } from './cells/RelationCell';
import { JsonCell } from './cells/JsonCell';
import { UnknownCell } from './cells/UnknownCell';

/**
 * Cell registry — field.type → read-only cell component.
 *
 * Extend via: cellRegistry.register('color', MyColorSwatchCell)
 */
export const cellRegistry = createRegistry<CellRenderer>({
  name: 'cell',
  fallback: UnknownCell,
  entries: {
    string: TextCell,
    text: TextCell,
    email: TextCell,
    url: TextCell,
    number: NumberCell,
    boolean: BooleanCell,
    date: DateCell,
    datetime: DateCell,
    select: SelectCell,
    multiselect: MultiSelectCell,
    relation: RelationCell,
    json: JsonCell,
  },
});
