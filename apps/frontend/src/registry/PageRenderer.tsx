'use client';

import type { AppConfig, Page } from '@ai-gen/shared';
import { pageRegistry } from './page-registry';

/**
 * Renders a single page by resolving its type in the `pageRegistry`.
 * Use this anywhere you need to host a config-defined page at runtime.
 */
export interface PageRendererHostProps {
  page: Page;
  config: AppConfig;
  params?: Record<string, string | undefined>;
}

export function PageRenderer({ page, config, params }: PageRendererHostProps) {
  const Component = pageRegistry.resolve(page.type);
  return <Component page={page} config={config} params={params} />;
}
