'use client';

import { Card, CardBody } from '@/components/ui';
import type { WidgetRenderer } from '../widget.types';

export const UnknownWidget: WidgetRenderer = ({ widget }) => (
  <Card tone="ember">
    <CardBody>
      <p className="text-2xs font-semibold uppercase tracking-wider text-ember-600">
        Unsupported widget
      </p>
      <p className="mt-1 text-sm text-paper-700">
        No renderer registered for <code>{String(widget.type)}</code>.
      </p>
    </CardBody>
  </Card>
);
