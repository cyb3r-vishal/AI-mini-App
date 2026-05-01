'use client';

import type { AppConfig } from '@ai-gen/shared';
import { normalizeAppConfig } from '@ai-gen/shared';
import { PageRenderer } from '@/registry';

/**
 * Registry showcase — runs each page renderer against a tiny demo config
 * that exercises the field + widget registries end-to-end.
 */
const raw: unknown = {
  id: 'demo',
  name: 'Registry Demo',
  entities: [
    {
      key: 'task',
      name: 'Task',
      fields: [
        { type: 'string', key: 'title', label: 'Title', required: true },
        { type: 'text', key: 'notes', label: 'Notes' },
        { type: 'number', key: 'priority', label: 'Priority', min: 1, max: 5 },
        { type: 'boolean', key: 'done', label: 'Done' },
        { type: 'date', key: 'dueDate', label: 'Due' },
        {
          type: 'select',
          key: 'status',
          label: 'Status',
          options: [
            { value: 'todo', label: 'To do' },
            { value: 'in-progress', label: 'In progress' },
            { value: 'done', label: 'Done' },
          ],
        },
        {
          type: 'multiselect',
          key: 'tags',
          label: 'Tags',
          options: [
            { value: 'frontend', label: 'Frontend' },
            { value: 'backend', label: 'Backend' },
            { value: 'infra', label: 'Infra' },
          ],
        },
        { type: 'json', key: 'meta', label: 'Metadata (JSON)' },
        // Deliberately unknown → fallback renderer.
        { type: 'color' as unknown as 'string', key: 'color', label: 'Color' },
      ],
    },
  ],
  pages: [
    {
      key: 'new-task',
      type: 'form',
      title: 'Create task',
      entity: 'task',
      layout: 'grid',
      submitLabel: 'Create',
    },
    {
      key: 'tasks',
      type: 'table',
      title: 'All tasks',
      entity: 'task',
      columns: [{ field: 'title' }, { field: 'status' }, { field: 'priority' }],
    },
    {
      key: 'home',
      type: 'dashboard',
      title: 'Overview',
      widgets: [
        { key: 'tot', type: 'metric', title: 'Total tasks', entity: 'task', aggregate: 'count', span: 3 },
        { key: 'by-status', type: 'chart', title: 'By status', entity: 'task', chartType: 'bar', xField: 'status', yField: 'priority', span: 5 },
        { key: 'recent', type: 'list', title: 'Recent', entity: 'task', limit: 5, span: 4 },
        { key: 'note', type: 'markdown', title: 'Note', content: 'Hello **world**. (Parser will plug in later.)', span: 6 },
        // Unknown widget → fallback.
        { key: 'w-x', type: 'unicorn' as unknown as 'list', title: 'Unknown', entity: 'task', limit: 5, span: 6 },
      ],
    },
    // Unknown page type → fallback.
    { key: 'wizard', type: 'wizard' as unknown as 'form', title: 'Wizard', entity: 'task', submitLabel: 'Go' },
  ],
};

const { config } = normalizeAppConfig(raw);

export default function RegistryShowcase() {
  // Normalization drops unknown page types and unknown widgets — we re-inject
  // a couple of deliberately unsupported items here so the fallbacks are
  // visible in the gallery.
  const hostileConfig: AppConfig = {
    ...config,
    pages: [
      ...config.pages,
      { key: 'ghost', type: 'ghost' as unknown as 'form', title: 'Ghost page', entity: 'task', submitLabel: 'Go' } as unknown as AppConfig['pages'][number],
    ],
  };

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Component Registry</h1>
        <p className="mt-2 max-w-2xl text-paper-600">
          Every page below is rendered by looking its <code>type</code> up in the
          page registry. Unknown types silently fall back — nothing crashes.
        </p>
      </header>

      {hostileConfig.pages.map((page) => (
        <section key={page.key} className="flex flex-col gap-3">
          <p className="text-2xs font-semibold uppercase tracking-[0.2em] text-paper-500">
            page · {page.type} / {page.key}
          </p>
          <PageRenderer page={page} config={hostileConfig} />
        </section>
      ))}
    </main>
  );
}
