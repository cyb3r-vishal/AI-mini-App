'use client';

/**
 * /apps/[id] — default landing inside the runner.
 *
 * Redirects to the first page from the config (preferring a dashboard when
 * one exists, otherwise the first page in declaration order). If the app has
 * no pages, shows a helpful empty state instead of a dead route.
 */

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
} from '@/components/ui';
import { useAppRunner } from './_runner-context';

export default function AppRunnerIndex() {
  const { app, config } = useAppRunner();
  const router = useRouter();

  useEffect(() => {
    if (config.pages.length === 0) return;
    const target =
      config.pages.find((p) => p.type === 'dashboard') ?? config.pages[0]!;
    router.replace(`/apps/${app.id}/${target.key}`);
  }, [config.pages, app.id, router]);

  if (config.pages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No pages in this app</CardTitle>
        </CardHeader>
        <CardBody>
          <EmptyState
            title="Publish a config with at least one page"
            description="Add a form, table, or dashboard in the app config and republish to see it here."
            tone="sun"
          />
        </CardBody>
      </Card>
    );
  }

  return null;
}
