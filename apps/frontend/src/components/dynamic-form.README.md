# DynamicForm

A production-ready, config-driven React form renderer.

## Inputs

- `entity: Entity` — the normalized entity definition (from `AppConfig.entities`).
- `fields?: string[]` — optional explicit subset/order of field keys.
- `mode?: 'create' | 'update'` — switches required-field behavior.
- `initialValues?` / `onSubmit` / `onSuccess` / `onCancel` / `submitLabel` / `layout`.

## Features

- ✅ **Config-driven rendering** via `FieldRenderer` + component registry.
- ✅ **Runtime validation** via the shared `buildCreateSchema` / `buildUpdateSchema` — same Zod rules as the backend.
- ✅ **Field-level errors** shown after a field is touched (blurred) or after submit.
- ✅ **Top-level errors** (`formError`) surfaced as an alert banner.
- ✅ **Backend error mapping** — HTTP 400 `details` payload is translated into per-field errors.
- ✅ **Loading state** via `Button loading` + `aria-busy` on the form.
- ✅ **Dirty tracking** — Save button disabled on unchanged update forms.
- ✅ **Graceful fallbacks** — missing entity, empty fields, or unknown field types don't crash.

## Behavior contracts

| Input                        | Behavior                                             |
| ---------------------------- | ---------------------------------------------------- |
| `entity` undefined           | Ember callout card — no crash                        |
| `entity.fields` empty        | Sun-tone callout card                                |
| `fields=['ghost']`           | Unknown keys silently skipped                        |
| Unknown field `type` in config | Renders `UnknownField` fallback from registry        |
| `onSubmit` throws            | Error surfaced at top + mapped to fields if possible |
| Successful submit, `create`  | Form resets (override via `resetOnSuccess={false}`)  |
| Successful submit, `update`  | "Saved ✓" footer, values retained                    |

## Usage — create a record through the CRUD engine

```tsx
import { api } from '@/lib/api-client';
import { DynamicForm } from '@/components/dynamic-form';

const config = await api.apps.getConfig(appId);
const entity = config.entities.find((e) => e.key === 'customer');

<DynamicForm
  entity={entity}
  mode="create"
  submitLabel="Create customer"
  onSubmit={(values) => api.records.create(appId, 'customer', values)}
  onSuccess={(record) => router.push(`/apps/${appId}/customer/${record.id}`)}
/>
```

## Usage — edit an existing record

```tsx
const record = await api.records.get(appId, 'customer', recordId);

<DynamicForm
  entity={entity}
  mode="update"
  initialValues={record.data}
  submitLabel="Save changes"
  onSubmit={(values) => api.records.update(appId, 'customer', recordId, values)}
/>
```

## How it plugs into the registry

- `FormPage` registry entry wraps `<DynamicForm />` already.
- Rendering a `form` page via `<PageRenderer page={...} config={...} />` just works.
- The hosting app can replace the registered `FormPage` component if it wants a different framing — the underlying `DynamicForm` is reusable on its own.

## Live demo

Route: **`/forms`** — submit with `boom@example.com` to see a simulated 400 with field errors; submit normally to see the payload echoed below the form.
