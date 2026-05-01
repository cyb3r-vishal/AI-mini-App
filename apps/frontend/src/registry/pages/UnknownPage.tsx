'use client';

import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui';
import type { PageRenderer } from '../page.types';

export const UnknownPage: PageRenderer = ({ page }) => (
  <Card tone="ember">
    <CardHeader>
      <CardTitle>Unsupported page</CardTitle>
    </CardHeader>
    <CardBody>
      <p className="text-sm text-paper-700">
        No renderer registered for page type <code>{String(page.type)}</code>.
      </p>
    </CardBody>
  </Card>
);
