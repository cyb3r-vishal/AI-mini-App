'use client';

import { useEffect, useState } from 'react';
import type { AppConfig, Entity, PublicApp } from '@ai-gen/shared';
import { AppShell } from '@/components/app-shell';
import { Card, CardBody, CardHeader, CardTitle, Select } from '@/components/ui';
import { DynamicTable } from '@/components/dynamic-table';
import { api } from '@/lib/api-client';

/**
 * Dynamic table showcase.
 *
 * Loads the user's apps, lets you pick one + an entity, and renders a live
 * `<DynamicTable />` against the backend CRUD engine. Requires auth.
 */
export default function DynamicTableShowcase() {
  const [apps, setApps] = useState<PublicApp[]>([]);
  const [appId, setAppId] = useState<string>('');
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [entityKey, setEntityKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load apps
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

  // Load config when app changes
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
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
          <p className="text-sm text-paper-500">Loading apps…</p>
        </main>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
          <Card tone="ember">
            <CardBody>
              <p className="text-sm text-paper-700">{error}</p>
            </CardBody>
          </Card>
        </main>
      </AppShell>
    );
  }

  if (apps.length === 0) {
    return (
      <AppShell>
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
          <Card tone="sun">
            <CardHeader>
              <CardTitle>No apps yet</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-paper-700">
                Create an app via the backend (<code>POST /apps</code>) with an initial
                config, then revisit this page to see the dynamic table in action.
              </p>
            </CardBody>
          </Card>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dynamic table</h1>
        <p className="text-paper-600">
          Columns, filtering, pagination, and actions — all driven by the app config.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-paper-500">
            App
          </span>
          <Select value={appId} onChange={(e) => setAppId(e.target.value)}>
            {apps.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · {a.slug}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-paper-500">
            Entity
          </span>
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

      {entity && (
        <DynamicTable
          appId={appId}
          entity={entity}
          title={`${entity.name} records`}
          onCreate={() => alert(`Create new ${entity.name} (wire up a modal / route here)`)}
          onEdit={(row) => alert(`Edit ${row.id}`)}
        />
      )}
    </main>
    </AppShell>
  );
}
