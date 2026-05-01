'use client';

import { createContext, useContext } from 'react';
import type { ListRecordsQuery } from '@ai-gen/shared';
import { api, type RecordListResult } from '@/lib/api-client';

/**
 * A tiny dependency-injection point for record reads.
 *
 * Runners (authenticated `/apps/[id]` and public `/shared/[...]`) provide
 * a `DataSource` via context. Widgets and DynamicTable consume it via
 * `useDataSource()` so the same registry components work under either
 * routing surface without caring which endpoint family to hit.
 *
 * Writes (create/update/delete) are NOT part of this interface — only the
 * authenticated runner exposes a write surface. Public widgets/tables
 * simply won't show write actions (the public runner hides them).
 */
export interface DataSource {
  listRecords(
    entity: string,
    query: Partial<ListRecordsQuery>,
  ): Promise<RecordListResult>;
}

/** Authenticated default — uses `/apps/:appId/entities/:entity/records`. */
export function createOwnerDataSource(appId: string): DataSource {
  return {
    listRecords: (entity, query) => api.records.list(appId, entity, query),
  };
}

/** Public/read-only — uses `/public/apps/:ownerId/:slug/entities/:entity/records`. */
export function createPublicDataSource(
  ownerId: string,
  slug: string,
): DataSource {
  return {
    listRecords: (entity, query) =>
      api.public.listRecords(ownerId, slug, entity, query),
  };
}

export const DataSourceContext = createContext<DataSource | null>(null);

export function useDataSource(): DataSource | null {
  return useContext(DataSourceContext);
}
