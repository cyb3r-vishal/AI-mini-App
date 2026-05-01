'use client';

import { useRouter } from 'next/navigation';
import type { TablePage as TablePageCfg } from '@ai-gen/shared';
import { Card, CardBody } from '@/components/ui';
import { DynamicTable } from '@/components/dynamic-table';
import type { PageRenderer } from '../page.types';

/**
 * TablePage registry entry.
 *
 * Delegates to <DynamicTable />, which does the actual fetching + rendering.
 * The hosting page passes `params.appId` through <PageRenderer /> so the
 * table knows which app's CRUD surface to call.
 */
export const TablePageRenderer: PageRenderer<TablePageCfg> = ({ page, config, params }) => {
  const router = useRouter();
  const entity = config.entities.find((e) => e.key === page.entity);
  const appId = params?.appId;
  const readOnly = params?.readOnly === 'true';

  // If there's a form page for the same entity, send "New …" there. If not
  // (or we're in read-only mode), onCreate stays undefined and the DynamicTable
  // toolbar hides the button.
  const formPage =
    !readOnly && !!appId
      ? config.pages.find((p) => p.type === 'form' && p.entity === page.entity)
      : undefined;
  const onCreate = formPage
    ? () => router.push(`/apps/${appId}/${formPage.key}`)
    : undefined;

  if (!appId) {
    return (
      <Card tone="sun">
        <CardBody>
          <p className="text-sm text-paper-700">
            Table pages need an <code>appId</code> to load data. Pass it via{' '}
            <code>&lt;PageRenderer params={'{'}appId{'}'} /&gt;</code>.
          </p>
        </CardBody>
      </Card>
    );
  }

  // Strip write actions when the caller marks the view read-only.
  const actions = readOnly
    ? page.actions.filter((a) => a === 'view')
    : page.actions;

  return (
    <DynamicTable
      appId={appId}
      entity={entity}
      title={page.title}
      columns={page.columns.map((c) => ({
        field: c.field,
        label: c.label,
        sortable: c.sortable,
        width: c.width,
      }))}
      actions={actions}
      pageSize={page.pageSize}
      searchable={page.searchable}
      onCreate={onCreate}
    />
  );
};
