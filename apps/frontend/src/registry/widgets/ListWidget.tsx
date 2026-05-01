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
  if (widget.type !== 'list') return null;

  const ds = useDataSource();
  const entity = config.entities.find((e) => e.key === widget.entity);
  const displayField =
    entity?.displayField ??
    entity?.fields.find((f) =>
      ['string', 'text', 'email', 'url'].includes(f.type),
    )?.key;

  const [items, setItems] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
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
          pageSize: widget.limit,
          sort:
            widget.sort === 'oldest'
              ? 'createdAt:asc'
              : ('createdAt:desc' as const),
        };
        const res = ds
          ? await ds.listRecords(widget.entity, query)
          : await api.records.list(appId!, widget.entity, query);
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
  }, [ds, appId, widget.entity, widget.limit, widget.sort]);

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
