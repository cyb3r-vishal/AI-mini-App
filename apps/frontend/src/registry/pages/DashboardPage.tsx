'use client';

import type { DashboardPage as DashboardPageCfg } from '@ai-gen/shared';
import { cn } from '@/lib/cn';
import type { PageRenderer } from '../page.types';
import { widgetRegistry } from '../widget-registry';

/**
 * DashboardPage — 12-column grid.
 * Each widget's renderer is resolved by `widgetRegistry.resolve(widget.type)`,
 * so adding a new widget kind is a single register() call.
 */
export const DashboardPageRenderer: PageRenderer<DashboardPageCfg> = ({ page, config, params }) => {
  const appId = params?.appId;
  return (
    <section className="flex flex-col gap-5">
      <h1 className="font-display text-2xl text-paper-900 sm:text-3xl">{page.title}</h1>
      <div className="grid grid-cols-12 gap-4">
        {page.widgets.map((widget) => {
          const Widget = widgetRegistry.resolve(widget.type);
          return (
            <div
              key={widget.key}
              className={cn('col-span-12', spanClass(widget.span))}
            >
              <Widget widget={widget} config={config} appId={appId} />
            </div>
          );
        })}
      </div>
    </section>
  );
};

function spanClass(span: number): string {
  const s = Math.min(12, Math.max(1, span));
  // Tailwind needs static class names — map each value explicitly.
  const map: Record<number, string> = {
    1: 'sm:col-span-1',
    2: 'sm:col-span-2',
    3: 'sm:col-span-3',
    4: 'sm:col-span-4',
    5: 'sm:col-span-5',
    6: 'sm:col-span-6',
    7: 'sm:col-span-7',
    8: 'sm:col-span-8',
    9: 'sm:col-span-9',
    10: 'sm:col-span-10',
    11: 'sm:col-span-11',
    12: 'sm:col-span-12',
  };
  return map[s] ?? 'sm:col-span-4';
}
