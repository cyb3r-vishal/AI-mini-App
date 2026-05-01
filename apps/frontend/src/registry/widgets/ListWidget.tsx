'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui';
import { ApiError, api, type RecordItem } from '@/lib/api-client';
import { useDataSource } from '../data-source';
import type { WidgetRenderer } from '../widget.types';

/**
 * ListWidget — renders the N newest/oldest records for an entity.
 * Uses the entity's `displayField` as the line label when available, else
 * falls back to the first string-ish field, else the record id.
 */
export const ListWidget: WidgetRenderer = ({ widget, config, appId }) => {
  // Always call hooks; narrow type via a flag to keep rules-of-hooks happy.
  const isList = widget.type === 'list';
  const entityKey = isList ? widget.entity : '';
  const limit = isList ? widget.limit : 0;
  const sort = isList ? widget.sort : 'newest';

  const ds = useDataSource();
  const entity = config.entities.find((e) => e.key === entityKey);
  const displayField =
    entity?.displayField ??
    entity?.fields.find((f) =>
      ['string', 'text', 'email', 'url'].includes(f.type),
    )?.key;

  const [items, setItems] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isList) return;
    if (!ds && !appId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const query = {
          page: 1,
          pageSize: limit,
          sort:
            sort === 'oldest'
              ? 'createdAt:asc'
              : ('createdAt:desc' as const),
        };
        const res = ds
          ? await ds.listRecords(entityKey, query)
          : await api.records.list(appId!, entityKey, query);
        if (!cancelled) setItems(res.items);
      } catch (e) {
        if (!cancelled) {
          setErr(
            e instanceof ApiError
              ? e.message
              : e instanceof Error
                ? e.message
                : 'error',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isList, ds, appId, entityKey, limit, sort]);

  if (!isList) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{widget.title}</CardTitle>
      </CardHeader>
      <CardBody>
        <ul className="divide-y-3 divide-paper-200 text-sm">
          {loading ? (
            <li className="py-2 text-paper-500">Loading…</li>
          ) : err ? (
            <li className="py-2 text-ember-600">Error: {err}</li>
          ) : items.length === 0 ? (
            <li className="py-2 text-paper-500">No {widget.entity} records yet.</li>
          ) : (
            items.map((it) => {
              const raw =
                displayField && (it.data as Record<string, unknown>)[displayField];
              const label =
                typeof raw === 'string' || typeof raw === 'number'
                  ? String(raw)
                  : `#${it.id.slice(0, 8)}`;
              return (
                <li key={it.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="truncate text-paper-800">{label}</span>
                  <span className="shrink-0 text-2xs uppercase tracking-wider text-paper-500">
                    {new Date(it.createdAt).toLocaleDateString()}
                  </span>
                </li>
              );
            })
          )}
        </ul>
        <p className="mt-3 text-2xs uppercase tracking-wider text-paper-500">
          {widget.limit} × {widget.entity} · {widget.sort}
        </p>
      </CardBody>
    </Card>
  );
};
