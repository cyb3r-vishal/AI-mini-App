'use client';

/**
 * Public runner page — mirrors `/apps/[id]/[pageKey]` but:
 *   - Resolves the page against the public-fetched config.
 *   - Rejects `form` pages (guests can't submit).
 *   - Relies on DataSourceContext (provided by the shared layout) so
 *     widgets/tables hit `/public/*` endpoints.
 */

import { useParams } from 'next/navigation';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
} from '@/components/ui';
import { PageRenderer } from '@/registry/PageRenderer';
import { useAppRunner } from '../../../../apps/[id]/_runner-context';

export default function SharedRunPage() {
  const rawParams = useParams<{
    ownerId: string;
    slug: string;
    pageKey: string | string[];
  }>();
  const pageKey = Array.isArray(rawParams.pageKey)
    ? rawParams.pageKey[0]!
    : rawParams.pageKey;
  const { app, config } = useAppRunner();

  const page = config.pages.find((p) => p.key === pageKey);

  if (!page) {
    return (
      <Card tone="sun">
        <CardHeader>
          <CardTitle>Page not found</CardTitle>
        </CardHeader>
        <CardBody>
          <EmptyState
            title={`No page with key "${pageKey}"`}
            description="It may have been removed in a newer version of the config. Pick another page from the sidebar."
            tone="sun"
          />
        </CardBody>
      </Card>
    );
  }

  if (page.type === 'form') {
    return (
      <Card tone="sun">
        <CardHeader>
          <CardTitle>This page is private</CardTitle>
        </CardHeader>
        <CardBody>
          <EmptyState
            title="Forms aren't available in the public view"
            description="Public viewers can explore dashboards and tables, but creating records requires the app's owner."
            tone="sun"
          />
        </CardBody>
      </Card>
    );
  }

  return (
    <PageRenderer
      page={page}
      config={config}
      // We still pass appId so the DynamicTable (which is still appId-scoped
      // for its API calls via api.records.*) short-circuits into the
      // DataSource path. We also pass a read-only flag via params so
      // descendant components can opt out of write actions.
      params={{ appId: app.id, pageKey, readOnly: 'true' }}
    />
  );
}
