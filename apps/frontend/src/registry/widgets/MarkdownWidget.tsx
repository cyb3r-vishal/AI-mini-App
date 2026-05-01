'use client';

import { Card, CardBody } from '@/components/ui';
import type { WidgetRenderer } from '../widget.types';

/**
 * Intentionally no markdown parser yet — just displays raw content in a
 * monospace block. Authors can swap with a real parser via register().
 */
export const MarkdownWidget: WidgetRenderer = ({ widget }) => {
  if (widget.type !== 'markdown') return null;
  return (
    <Card>
      <CardBody>
        <pre className="whitespace-pre-wrap font-mono text-sm text-paper-800">
          {widget.content || '(empty markdown)'}
        </pre>
      </CardBody>
    </Card>
  );
};
