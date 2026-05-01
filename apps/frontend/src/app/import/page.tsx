'use client';

import { useEffect, useState } from 'react';
import type { AppConfig, Entity, PublicApp } from '@ai-gen/shared';
import { AppShell } from '@/components/app-shell';
import { Card, CardBody, CardHeader, CardTitle, Select } from '@/components/ui';
import { CsvImport } from '@/components/csv-import';
import { api } from '@/lib/api-client';

export default function CsvImportShowcase() {
  const [apps, setApps] = useState<PublicApp[]>([]);
  const [appId, setAppId] = useState<string>('');
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [entityKey, setEntityKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await api.apps.list();
        if (cancelled) return;
        setApps(list);
        if (list.length > 0) setAppId(list[0]!.id);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load apps');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!appId) {
      setConfig(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const cfg = await api.apps.getConfig(appId);
        if (cancelled) return;
        setConfig(cfg);
        if (cfg.entities.length > 0) setEntityKey(cfg.entities[0]!.key);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load config');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appId]);

  const entity: Entity | undefined = config?.entities.find((e) => e.key === entityKey);

  if (loading) {
    return (
      <AppShell>
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
          <p className="text-sm text-paper-500">Loading apps…</p>
        </main>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
          <Card tone="ember">
            <CardBody>
              <p className="text-sm text-paper-700">{error}</p>
            </CardBody>
          </Card>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">CSV import</h1>
        <p className="mt-2 text-paper-600">
          Upload a CSV, map columns to entity fields, and bulk-insert records.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-paper-500">App</span>
          <Select value={appId} onChange={(e) => setAppId(e.target.value)}>
            {apps.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · {a.slug}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-paper-500">Entity</span>
          <Select
            value={entityKey}
            onChange={(e) => setEntityKey(e.target.value)}
            disabled={!config || config.entities.length === 0}
          >
            {config?.entities.map((e) => (
              <option key={e.key} value={e.key}>
                {e.name}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {entity ? (
        <CsvImport appId={appId} entity={entity} />
      ) : (
        <Card tone="sun">
          <CardHeader>
            <CardTitle>Pick an entity to import into</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-paper-700">
              Entities come from the selected app&apos;s config. Create an app first if none exist.
            </p>
          </CardBody>
        </Card>
      )}
    </main>
    </AppShell>
  );
}
