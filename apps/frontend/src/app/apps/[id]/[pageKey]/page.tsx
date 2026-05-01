'use client';

/**
 * /apps/[id]/[pageKey] — the actual "run a config-generated page" route.
 *
 * Thin controller:
 *   1. Pick the page from the context-loaded config by `pageKey`.
 *   2. Dispatch rendering to the shared `<PageRenderer />` from the registry.
 *   3. Pass `params.appId` through so TablePage/FormPage can wire to the CRUD API.
 *
 * No switch-case on page.type. Adding a new page type is purely a registry
 * concern (`pageRegistry.register('kanban', KanbanPage)`).
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
import { useAppRunner } from '../_runner-context';

export default function RunPage() {
  const rawParams = useParams<{ id: string; pageKey: string | string[] }>();
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
            description="It may have been removed in a newer version of the config. Pick a page from the sidebar or update your config and republish."
            tone="sun"
          />
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header removed: the page title now comes from the renderer itself
          (e.g. DashboardPage / TablePage header) so we don't duplicate it.
          The app-level hero above provides the app name + quick actions. */}
      <PageRenderer
        page={page}
        config={config}
        params={{ appId: app.id, pageKey }}
      />
    </div>
  );
}
