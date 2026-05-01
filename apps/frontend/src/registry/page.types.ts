import type { ComponentType } from 'react';
import type { AppConfig, Page, PageType } from '@ai-gen/shared';

/**
 * Page renderer contract.
 *
 * Every page component receives:
 *   - its `Page` definition (from AppConfig),
 *   - the full AppConfig (to resolve related entities / pages / theme),
 *   - optional `params` (route params) so pages can be embedded or standalone.
 */
export interface PageRendererProps<TPage extends Page = Page> {
  page: TPage;
  config: AppConfig;
  /** Route params like `{ id: 'abc' }` for detail/edit pages. */
  params?: Record<string, string | undefined>;
}

export type PageRenderer<TPage extends Page = Page> = ComponentType<PageRendererProps<TPage>>;

// eslint-disable-next-line @typescript-eslint/ban-types
export type PageKey = PageType | (string & {});
