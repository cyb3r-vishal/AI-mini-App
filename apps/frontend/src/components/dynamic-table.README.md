# DynamicTable

Config-driven data table bound to the CRUD engine.

## Inputs

```ts
interface DynamicTableProps {
  appId: string;                // tenant scope
  entity: Entity | undefined;   // from AppConfig.entities
  columns?: DynamicTableColumn[]; // optional explicit column set (from TablePage)
  actions?: ('create' | 'view' | 'edit' | 'delete')[];
  pageSize?: number;
  searchable?: boolean;
  title?: ReactNode;
  onCreate?: () => void;
  onView?:   (row: RecordItem) => void;
  onEdit?:   (row: RecordItem) => void;
  card?: boolean;               // defaults to true
}
```

## Features

- ✅ **Columns from config** — falls back to `entity.fields` (minus `json`) when none given.
- ✅ **Pagination** — page, pageSize selector, prev/next; auto-resets to page 1 on search/filter/sort changes.
- ✅ **Search** — debounced (250 ms) and sent as the `q` query param.
- ✅ **Loading** — 5-row skeleton on first load; `isRefetching` dims the table on subsequent refetches.
- ✅ **Empty** — contextual copy ("No customers yet." vs. "No results for 'jane'.").
- ✅ **Error** — inline banner inside the table body + a Retry button.
- ✅ **Row actions** — view / edit (callbacks) + delete with **optimistic removal and rollback on failure**.
- ✅ **Stale-request guards** — response ignored if a newer request has been issued.

## Safe by design

| Issue                        | Behavior                                      |
| ---------------------------- | --------------------------------------------- |
| `entity` undefined           | Ember callout — no crash                      |
| No columns / no fields       | Sun-tone callout                              |
| Column points at missing field | Header shows a red `missing` badge; cell shows `—` |
| Unknown field type           | `UnknownCell` fallback (safe stringify)       |
| Delete fails                 | Auto refetch + alert (row reappears)          |
| Stale responses              | Ignored via monotonic request id              |

## Wiring

```tsx
import { DynamicTable } from '@/components/dynamic-table';

<DynamicTable
  appId={appId}
  entity={entity}
  columns={page.columns}
  pageSize={page.pageSize}
  onCreate={() => router.push(`/apps/${appId}/${entity.key}/new`)}
  onEdit={(row) => router.push(`/apps/${appId}/${entity.key}/${row.id}`)}
/>
```

`TablePage` registry entry now delegates here automatically — rendering a
`type: "table"` page via `<PageRenderer />` just works (pass `appId` through
`params`).

## Cell registry

Cells are looked up by field `type`. Add a custom renderer with one line:

```ts
import { cellRegistry } from '@/registry';
cellRegistry.register('color', ColorSwatchCell);
```

Built-ins: `TextCell` (string/text/email/url), `NumberCell`, `BooleanCell`,
`DateCell` (date/datetime), `SelectCell` / `MultiSelectCell`, `RelationCell`,
`JsonCell`, `UnknownCell` (fallback).

## Live demo

Route: **`/tables`** — pick an app + entity to see the live table against
your backend. Requires sign-in and at least one app.
