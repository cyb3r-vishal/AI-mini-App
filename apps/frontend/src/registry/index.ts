/**
 * Component Registry — barrel.
 *
 * Public API:
 *   - createRegistry()                generic primitive
 *   - fieldRegistry / FieldRenderer   field-type → component
 *   - widgetRegistry                  widget-type → component
 *   - pageRegistry / PageRenderer     page-type  → component
 *
 * To extend:
 *   import { fieldRegistry } from '@/registry';
 *   fieldRegistry.register('color', MyColorField);
 *
 * No switch-case is required — ever.
 *
 * --- Naming note -------------------------------------------------------------
 * `field.types.ts` / `page.types.ts` / `cell.types.ts` each export a *type*
 * aliased to `FieldRenderer` / `PageRenderer` / `CellRenderer` (the contract a
 * registered component satisfies). The matching `.tsx` files also export a
 * React *component* with the same name. Wildcard re-exports across both would
 * be ambiguous — so we re-export the contract types under disambiguated
 * aliases (`*RendererContract`) while keeping the components under their
 * original names so consumers can write `<PageRenderer />` etc.
 */
export * from './create-registry';

// --- Fields ------------------------------------------------------------------
export type {
  FieldRendererProps,
  FieldKey,
  FieldRenderer as FieldRendererContract,
} from './field.types';
export * from './field-registry';
export { FieldRenderer } from './FieldRenderer';
export type { FieldRendererShellProps } from './FieldRenderer';

// --- Pages -------------------------------------------------------------------
export type {
  PageRendererProps,
  PageKey,
  PageRenderer as PageRendererContract,
} from './page.types';
export * from './page-registry';
export { PageRenderer } from './PageRenderer';
export type { PageRendererHostProps } from './PageRenderer';

// --- Widgets -----------------------------------------------------------------
export * from './widget.types';
export * from './widget-registry';

// --- Cells -------------------------------------------------------------------
export type {
  CellRendererProps,
  CellRenderer as CellRendererContract,
} from './cell.types';
export * from './cell-registry';
export { CellRenderer } from './CellRenderer';
export type { CellRendererHostProps } from './CellRenderer';
