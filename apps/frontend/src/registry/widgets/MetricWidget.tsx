'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardBody } from '@/components/ui';
import { ApiError, api } from '@/lib/api-client';
import { useDataSource } from '../data-source';
import type { WidgetRenderer } from '../widget.types';

/**
 * MetricWidget — fetches records for the entity and computes the aggregate
 * (count / sum / avg / min / max) client-side. For hackathon-scale datasets
 * that's plenty; a server-side aggregate endpoint can replace this later.
 */
export const MetricWidget: WidgetRenderer = ({ widget, appId }) => {
  // Always call hooks; narrow widget type via a flag.
  const isMetric = widget.type === 'metric';
  const entity = isMetric ? widget.entity : '';
  const aggregate = isMetric ? widget.aggregate : 'count';
  const field = isMetric ? widget.field : undefined;

  const ds = useDataSource();
  const [value, setValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isMetric) return;
    if (!ds && !appId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // `count` only needs the total; everything else needs the values.
        // Server caps pageSize at 200; fine for hackathon-scale datasets.
        const pageSize = aggregate === 'count' ? 1 : 200;
        const res = ds
          ? await ds.listRecords(entity, { page: 1, pageSize })
          : await api.records.list(appId!, entity, {
              page: 1,
              pageSize,
            });
        if (cancelled) return;

        if (aggregate === 'count') {
          setValue(res.total);
          return;
        }

        if (!field) {
          setValue(null);
          setErr('missing field');
          return;
        }
        const nums: number[] = [];
        for (const item of res.items) {
          const raw = (item.data as Record<string, unknown>)[field];
          const n = typeof raw === 'number' ? raw : Number(raw);
          if (Number.isFinite(n)) nums.push(n);
        }
        if (nums.length === 0) {
          setValue(null);
          return;
        }
        switch (aggregate) {
          case 'sum':
            setValue(nums.reduce((a, b) => a + b, 0));
            break;
          case 'avg':
            setValue(nums.reduce((a, b) => a + b, 0) / nums.length);
            break;
          case 'min':
            setValue(Math.min(...nums));
            break;
          case 'max':
            setValue(Math.max(...nums));
            break;
          default:
            setValue(null);
        }
      } catch (e) {
        if (cancelled) return;
        setErr(e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'error');
        setValue(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isMetric, ds, appId, entity, aggregate, field]);

  const display = useMemo(() => {
    if (loading) return '…';
    if (value === null) return '—';
    // Keep integers tidy; round avg to 2 decimals, strip trailing zeros.
    if (Number.isInteger(value)) return value.toLocaleString();
    return Number(value.toFixed(2)).toLocaleString();
  }, [loading, value]);

  if (!isMetric) return null;

  return (
    <Card tone="brand">
      <CardBody>
        <p className="text-2xs font-semibold uppercase tracking-[0.2em] text-brand-700">
          {widget.title}
        </p>
        <p className="mt-2 font-display text-3xl text-paper-900">{display}</p>
        <p className="mt-1 text-xs text-paper-600">
          {widget.aggregate} of {widget.entity}
          {err ? ` · ${err}` : ''}
        </p>
      </CardBody>
    </Card>
  );
};
