'use client';

import type { FormPage as FormPageCfg } from '@ai-gen/shared';
import { DynamicForm } from '@/components/dynamic-form';
import { api } from '@/lib/api-client';
import type { PageRenderer } from '../page.types';

/**
 * FormPage registry entry.
 *
 * Looks up the entity from the config and delegates to <DynamicForm />,
 * which handles validation, loading/error states.
 *
 * Wiring:
 *   - If `params.appId` is provided, submits go through the CRUD engine
 *     (`api.records.create` / `api.records.update`). This makes the
 *     form fully functional inside the app runner with zero glue code.
 *   - If not (showcase / preview / standalone), submits are logged to the
 *     console so the component still renders without crashing.
 */
export const FormPageRenderer: PageRenderer<FormPageCfg> = ({ page, config, params }) => {
  const entity = config.entities.find((e) => e.key === page.entity);
  const appId = params?.appId;
  const recordId = params?.recordId;
  const mode: 'create' | 'update' =
    page.onSubmit.action === 'update' || recordId ? 'update' : 'create';

  return (
    <DynamicForm
      entity={entity}
      fields={page.fields}
      layout={page.layout}
      title={page.title}
      submitLabel={page.submitLabel}
      mode={mode}
      onSubmit={async (values) => {
        if (!appId || !entity) {
          // Showcase / preview fallback.
          // eslint-disable-next-line no-console
          console.info('[FormPage submit]', { entity: page.entity, values });
          return values;
        }
        if (mode === 'update' && recordId) {
          return api.records.update(appId, entity.key, recordId, values);
        }
        return api.records.create(appId, entity.key, values);
      }}
    />
  );
};
