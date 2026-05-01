# Component Registry

A map-based, crash-proof dispatch system for rendering config-driven UI.

**Three registries:**

| Registry         | Key                         | Maps to                                                    |
| ---------------- | --------------------------- | ---------------------------------------------------------- |
| `fieldRegistry`  | `Field["type"]`             | React component that renders a form control                |
| `widgetRegistry` | `Widget["type"]`            | React component that renders a dashboard widget            |
| `pageRegistry`   | `Page["type"]`              | React component that renders a full page                   |

All three are built from the same `createRegistry()` primitive. They share the
same public API: `get` · `resolve` · `register` · `registerAll` · `unregister` · `has` · `keys` · `size`.

## ❌ No switch-case

Rendering is a **lookup**, not a conditional chain:

```ts
const Component = fieldRegistry.resolve(field.type);
return <Component field={field} value={value} onChange={onChange} />;
```

Adding a new type is ONE line at the bottom of the app (or anywhere during init):

```ts
import { fieldRegistry } from '@/registry';
import { ColorField } from './ColorField';

fieldRegistry.register('color', ColorField);
```

No existing file is touched.

## 🧱 Contracts

### Field component

```ts
interface FieldRendererProps<TField extends Field = Field> {
  field: TField;
  value: unknown;
  onChange: (next: unknown) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  id?: string;
  autoFocus?: boolean;
}
```

### Widget component

```ts
interface WidgetRendererProps {
  widget: Widget;
  config: AppConfig;
}
```

### Page component

```ts
interface PageRendererProps {
  page: Page;
  config: AppConfig;
  params?: Record<string, string | undefined>;
}
```

## 🧯 Fallbacks (never crash)

Every registry is created with a `fallback` entry. When `.resolve(key)` misses:

- A dev warning is logged via `console.warn`.
- The fallback component is returned.

Built-in fallbacks: `UnknownField`, `UnknownWidget`, `UnknownPage` — each shows
a small ember-toned callout so authors can see which type is missing without
the whole screen going white.

## 📂 Layout

```
src/registry/
├── create-registry.ts         # generic map + resolve() + fallback
├── field.types.ts             # FieldRenderer<TField>
├── field-registry.ts          # registers every built-in field type
├── FieldRenderer.tsx          # host that looks up + wraps in FormField
├── fields/
│   ├── TextField.tsx          # string | email | url
│   ├── TextareaField.tsx      # text
│   ├── NumberField.tsx
│   ├── BooleanField.tsx
│   ├── DateField.tsx          # date | datetime
│   ├── SelectField.tsx
│   ├── MultiSelectField.tsx
│   ├── RelationField.tsx
│   ├── JsonField.tsx
│   └── UnknownField.tsx       # fallback
│
├── page.types.ts
├── page-registry.ts
├── PageRenderer.tsx
├── pages/
│   ├── FormPage.tsx
│   ├── TablePage.tsx
│   ├── DashboardPage.tsx      # uses widgetRegistry internally
│   └── UnknownPage.tsx
│
├── widget.types.ts
├── widget-registry.ts
├── widgets/
│   ├── MetricWidget.tsx
│   ├── ChartWidget.tsx
│   ├── ListWidget.tsx
│   ├── MarkdownWidget.tsx
│   └── UnknownWidget.tsx
│
└── index.ts                   # barrel
```

## 🧪 Usage

### Render a page from config

```tsx
import { PageRenderer } from '@/registry';

<PageRenderer page={page} config={config} />
```

### Render a single field (inside a custom form)

```tsx
import { FieldRenderer } from '@/registry';

<FieldRenderer field={field} value={value} onChange={setValue} error={errorMsg} />
```

### Override a component at startup

```tsx
import { widgetRegistry } from '@/registry';
import { RechartsMetric } from './RechartsMetric';

widgetRegistry.register('metric', RechartsMetric);
```

### Accept an entirely custom component type

Because registry keys are `string`, configs can ship custom types
(`"rating"`, `"signature"`, `"kanban-board"`) — just register a matching
component and the renderer works out of the box.

## 🌐 Showcase

Route: **`/registry`** (`apps/frontend/src/app/registry/page.tsx`) — includes
deliberately malformed fields, widgets, and page types to demonstrate the
fallback behavior.
