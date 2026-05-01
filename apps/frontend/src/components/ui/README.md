# BlockKit — Design System

Cartoon + Minecraft-inspired UI. Blocky shapes, soft chunky drop shadows,
pixel-crisp edges — paired with modern typography and a restrained palette.

Explore the full gallery at `/ui` (route: `apps/frontend/src/app/ui/page.tsx`).

## 🎨 Design language

| Trait           | Value                                                                                                     |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| Corners         | Tight: `rounded-block` (6px) / `rounded-block-lg` (10px). Never pills.                                     |
| Borders         | Always visible: `border-3` — gives the "blocky" outline.                                                   |
| Shadows         | Solid offset drop: `shadow-block` / `shadow-block-lg`. Press in on click (`active:translate-y-[2px]`).     |
| Surfaces        | Paper-cream background (`paper-50`) with a subtle 24px pixel-grid wallpaper.                              |
| Palette         | `paper` (neutral), `brand` (grass green), `sky`, `sun`, `ember`. Bright but narrow.                       |
| Typography      | Inter for UI, Press Start 2P for display/decorative. Crisp tracking-tight weights.                         |
| Focus           | Colored soft glow ring (`shadow-focus*`) — no Chrome default outline.                                      |

## 🧱 Components

| Component             | Exports                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| **Button**            | `Button`, `buttonVariants`. Variants: `primary · secondary · outline · ghost · sky · danger`.     |
| **Input**             | `Input` (size `sm/md/lg`, leading/trailing slots, `invalid`).                                     |
| **Textarea**          | `Textarea`.                                                                                       |
| **Select**            | `Select` (native, themed, custom chevron).                                                       |
| **Label**             | `Label` (`required`).                                                                             |
| **Card**              | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardBody`, `CardFooter`. Tones + elevations. |
| **Table**             | `TableContainer`, `Table`, `TableHead`, `TableBody`, `TableFoot`, `TableRow`, `TableHeaderCell`, `TableCell`, `TableCaption`, `TableEmpty`. |
| **Form**              | `Form`, `FormSection`, `FormRow`, `FormField`, `FormActions`, `useFormField`.                     |
| **Badge**             | `Badge` (tones: `neutral · brand · sky · sun · ember`).                                           |

## 🧪 Usage

```tsx
import {
  Button,
  Card,
  CardBody,
  Form,
  FormField,
  FormActions,
  Input,
  Select,
} from '@/components/ui';

<Card>
  <CardBody>
    <Form onSubmit={handle}>
      <FormField label="Email" required hint="We won't send spam.">
        <Input type="email" />
      </FormField>
      <FormField label="Role">
        <Select>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </Select>
      </FormField>
      <FormActions>
        <Button variant="ghost" type="reset">Cancel</Button>
        <Button type="submit">Save</Button>
      </FormActions>
    </Form>
  </CardBody>
</Card>
```

## ♿ Accessibility

- **Focus**: `focus-visible` only — no outline on mouse clicks, clear ring on keyboard nav.
- **Forms**: `<FormField>` auto-wires `id`, `aria-invalid`, and `aria-describedby`. Errors use `role="alert"`.
- **Icons**: decorative SVGs use `aria-hidden`.
- **Buttons**: explicit `type="button"` by default (forms don't accidentally submit).

## 📐 Responsive

Utilities are mobile-first. Grid helpers (`FormRow cols={2|3}`) collapse at `<sm`. Tables scroll horizontally inside `TableContainer`. Sizes (`sm/md/lg`) keep tap targets ≥ 36 px.

## 🎨 Theming

Tokens live in two places:

1. **Tailwind config** (`tailwind.config.ts`) — colors, radii, shadows, fonts.
2. **CSS variables** (`globals.css`) — semantic tokens (`--bk-bg`, `--bk-border`, `--bk-brand`) for easy dark-mode / per-app theming later.

Switching the `brand` hue is a single edit; every component picks it up.
