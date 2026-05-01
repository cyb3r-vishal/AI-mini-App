'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui';
import { ApiError, api, type RecordItem } from '@/lib/api-client';
import { useDataSource } from '../data-source';
import type { WidgetRenderer } from '../widget.types';

/**
 * ChartWidget — groups records by `xField` and counts (or sums `yField` if it
 * looks numeric). Renders as CSS bars; simple + dependency-free but real data.
 *
 * When `xField === yField` (common when the model uses the same field to
 * group + count) we always count.
 */
export const ChartWidget: WidgetRenderer = ({ widget, appId }) => {
  // Hooks MUST be called unconditionally (rules-of-hooks). Narrow the
  // widget type lazily inside the effect instead of early-returning first.
  const isChart = widget.type === 'chart';
  const entity = isChart ? widget.entity : '';
  const xField = isChart ? widget.xField : '';
  const yField = isChart ? widget.yField : '';

  const ds = useDataSource();
  const [items, setItems] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isChart) return;
    if (!ds && !appId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const q = { page: 1, pageSize: 200 };
        const res = ds
          ? await ds.listRecords(entity, q)
          : await api.records.list(appId!, entity, q);
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
  }, [isChart, ds, appId, entity]);

  const buckets = useMemo(() => {
    if (!isChart) return [] as Array<{ label: string; value: number }>;
    if (items.length === 0) return [] as Array<{ label: string; value: number }>;
    const countOnly = xField === yField;
    const map = new Map<string, number>();
    for (const it of items) {
      const data = it.data as Record<string, unknown>;
      const rawX = data[xField];
      const key =
        rawX === null || rawX === undefined ? '(none)' : String(rawX);
      let delta = 1;
      if (!countOnly) {
        const rawY = data[yField];
        const n = typeof rawY === 'number' ? rawY : Number(rawY);
        delta = Number.isFinite(n) ? n : 0;
      }
      map.set(key, (map.get(key) ?? 0) + delta);
    }
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);
  }, [isChart, items, xField, yField]);

  // Safe to bail after all hooks have been called.
  if (!isChart) return null;

  const max = buckets.reduce((m, b) => Math.max(m, b.value), 0) || 1;

  return (
    <Card tone="sky">
      <CardHeader>
        <CardTitle>{widget.title}</CardTitle>
      </CardHeader>
      <CardBody>
        {loading ? (
          <p className="text-sm text-paper-500">Loading…</p>
        ) : err ? (
          <p className="text-sm text-ember-600">Error: {err}</p>
        ) : buckets.length === 0 ? (
          <p className="text-sm text-paper-500">
            No {widget.entity} records yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {buckets.map((b) => (
              <div key={b.label} className="flex items-center gap-3 text-xs">
                <span className="w-28 shrink-0 truncate text-paper-700">{b.label}</span>
                <div className="relative h-5 flex-1 overflow-hidden rounded-block border-2 border-sky-700 bg-sky-50">
                  <div
                    className="h-full bg-sky-300"
                    style={{ width: `${(b.value / max) * 100}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right font-mono text-paper-800">
                  {Number.isInteger(b.value)
                    ? b.value
                    : Number(b.value.toFixed(2))}
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-paper-600">
          {widget.chartType} · {widget.xField}
          {widget.xField !== widget.yField ? ` × ${widget.yField}` : ''}
        </p>
      </CardBody>
    </Card>
  );
};
