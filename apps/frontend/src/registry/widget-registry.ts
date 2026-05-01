import { createRegistry } from './create-registry';
import type { WidgetRenderer } from './widget.types';
import { MetricWidget } from './widgets/MetricWidget';
import { ChartWidget } from './widgets/ChartWidget';
import { ListWidget } from './widgets/ListWidget';
import { MarkdownWidget } from './widgets/MarkdownWidget';
import { UnknownWidget } from './widgets/UnknownWidget';

export const widgetRegistry = createRegistry<WidgetRenderer>({
  name: 'widget',
  fallback: UnknownWidget,
  entries: {
    metric: MetricWidget,
    chart: ChartWidget,
    list: ListWidget,
    markdown: MarkdownWidget,
  },
});
