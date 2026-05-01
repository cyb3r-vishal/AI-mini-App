'use client';

/**
 * Public runner index — redirect to the first viewable page (dashboards
 * first, then tables; forms are never exposed publicly).
 */

import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
} from '@/components/ui';
import { useAppRunner } from '../../../apps/[id]/_runner-context';

export default function SharedIndex() {
  const { config } = useAppRunner();
  const router = useRouter();
  const params = useParams<{ ownerId: string; slug: string }>();

  useEffect(() => {
    const candidate =
      config.pages.find((p) => p.type === 'dashboard') ??
      config.pages.find((p) => p.type === 'table');
    if (!candidate) return;
    router.replace(`/shared/${params.ownerId}/${params.slug}/${candidate.key}`);
  }, [config.pages, router, params]);

  const candidate =
    config.pages.find((p) => p.type === 'dashboard') ??
    config.pages.find((p) => p.type === 'table');

  if (!candidate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nothing to show</CardTitle>
        </CardHeader>
        <CardBody>
          <EmptyState
            title="This app has no public pages"
            description="Its owner hasn't added a dashboard or table."
            tone="sun"
          />
        </CardBody>
      </Card>
    );
  }
  return null;
}
