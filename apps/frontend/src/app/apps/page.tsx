'use client';

/**
 * /apps
 *
 * Apps index for the signed-in user. Lists apps + lets you create one from a
 * JSON config (pasted or picked from a bundled example). Each app links to
 * `/apps/[id]` which is the **app runner** — the config-driven runtime where
 * the user can interact with forms, tables, and dashboards defined by their
 * own AppConfig.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { PublicApp } from '@ai-gen/shared';
import { normalizeAppConfig } from '@ai-gen/shared';
import { AppShell } from '@/components/app-shell';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  Input,
  Label,
  Skeleton,
  Textarea,
} from '@/components/ui';
import { ApiError, api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

// A tiny starter config so first-time users can hit "Create" and see something
// immediately instead of staring at a JSON textarea.
const STARTER_CONFIG = {
  id: 'my-first-app',
  name: 'My First App',
  description: 'Auto-generated starter with a tasks board.',
  entities: [
    {
      key: 'task',
      name: 'Task',
      fields: [
        { type: 'string', key: 'title', label: 'Title', required: true },
        { type: 'text', key: 'notes', label: 'Notes' },
        {
          type: 'select',
          key: 'status',
          label: 'Status',
          options: [
            { value: 'todo', label: 'To do' },
            { value: 'doing', label: 'In progress' },
            { value: 'done', label: 'Done' },
          ],
          defaultValue: 'todo',
        },
        { type: 'number', key: 'priority', label: 'Priority', min: 1, max: 5, defaultValue: 3 },
        { type: 'boolean', key: 'starred', label: 'Starred' },
        { type: 'date', key: 'dueDate', label: 'Due' },
      ],
      displayField: 'title',
    },
  ],
  pages: [
    {
      key: 'overview',
      type: 'dashboard',
      title: 'Overview',
      widgets: [
        { key: 'total', type: 'metric', title: 'Total tasks', entity: 'task', aggregate: 'count', span: 4 },
        { key: 'recent', type: 'list', title: 'Recent', entity: 'task', limit: 5, span: 8 },
        {
          key: 'welcome',
          type: 'markdown',
          title: 'Welcome',
          span: 12,
          content:
            "# Welcome 👋\n\nThis is your generated app. Edit the JSON config to add fields, pages, and widgets — the UI updates automatically.",
        },
      ],
    },
    {
      key: 'new-task',
      type: 'form',
      title: 'Create task',
      entity: 'task',
      submitLabel: 'Create',
      layout: 'grid',
    },
    {
      key: 'all-tasks',
      type: 'table',
      title: 'All tasks',
      entity: 'task',
      columns: [{ field: 'title' }, { field: 'status' }, { field: 'priority' }, { field: 'dueDate' }],
    },
  ],
};

export default function AppsIndexPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [apps, setApps] = useState<PublicApp[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);
  const [slug, setSlug] = useState('my-first-app');
  const [name, setName] = useState('My First App');
  const [configJson, setConfigJson] = useState(
    JSON.stringify(STARTER_CONFIG, null, 2),
  );

  // AI generation state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const [aiIssueCount, setAiIssueCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await api.apps.list();
        if (!cancelled) setApps(list);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load apps');
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  async function handleGenerate() {
    setAiErr(null);
    setAiIssueCount(null);
    const prompt = aiPrompt.trim();
    if (prompt.length < 4) {
      setAiErr('Describe your app in a sentence or two first.');
      return;
    }
    setAiBusy(true);
    try {
      const { config, issues } = await api.ai.generateConfig({
        prompt,
        slug: slug || undefined,
        name: name || undefined,
      });
      setConfigJson(JSON.stringify(config, null, 2));
      // Sync slug/name to whatever the model chose so Create uses the same IDs.
      if (typeof config.id === 'string' && config.id) setSlug(config.id);
      if (typeof config.name === 'string' && config.name) setName(config.name);
      setAiIssueCount(Array.isArray(issues) ? issues.length : 0);
    } catch (err) {
      setAiErr(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'AI generation failed',
      );
    } finally {
      setAiBusy(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateErr(null);
    setCreating(true);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(configJson);
      } catch {
        throw new Error('Config is not valid JSON.');
      }
      // Normalize client-side first so we surface warnings before the round-trip.
      const { issues } = normalizeAppConfig(parsed);
      if (issues.length > 0) {
        // Not fatal — the backend normalizes again and will accept partial configs.
        // Just log for the user.
        // eslint-disable-next-line no-console
        console.info('[create app] config issues:', issues);
      }
      const created = await api.apps.create({
        slug,
        name,
        config: parsed,
      });
      router.push(`/apps/${created.id}`);
    } catch (err) {
      setCreateErr(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to create app',
      );
    } finally {
      setCreating(false);
    }
  }

  if (isLoading || !isAuthenticated) {
    return (
      <AppShell>
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
          <Skeleton className="h-8 w-40" />
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Your apps</h1>
          <p className="text-paper-600">
            Every app is fully defined by a JSON config. Edit the config, republish, and
            the runtime updates — no redeploy required.
          </p>
        </header>

        {/* --- Existing apps ------------------------------------------------ */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-paper-500">
            Existing
          </h2>

          {fetching ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : error ? (
            <ErrorState title="Couldn't load apps" message={error} />
          ) : apps.length === 0 ? (
            <EmptyState
              title="No apps yet"
              description="Create one with the form below to see the runtime in action."
            />
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {apps.map((app) => (
                <li key={app.id}>
                  <Link href={`/apps/${app.id}`} className="block">
                    <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-block-md">
                      <CardHeader>
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle>{app.name}</CardTitle>
                          <Badge tone={app.status === 'PUBLISHED' ? 'brand' : 'neutral'}>
                            {app.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardBody>
                        {app.description && (
                          <p className="line-clamp-2 text-sm text-paper-600">
                            {app.description}
                          </p>
                        )}
                      </CardBody>
                      <CardFooter>
                        <p className="text-xs text-paper-500">
                          /{app.slug} · v{app.activeConfigVersion ?? '?'}
                        </p>
                      </CardFooter>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* --- Create -------------------------------------------------------- */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Create a new app</CardTitle>
            </CardHeader>
            <CardBody>
              <form className="flex flex-col gap-4" onSubmit={handleCreate}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      required
                      // Use anchors so Chromium's unicode-mode regex parser
                      // doesn't choke (see console warning with `/[a-z0-9-]+/v`).
                      pattern="^[a-z0-9][a-z0-9-]*[a-z0-9]$"
                      title="lowercase letters, digits, hyphens; must start and end with a letter or digit"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* --- AI describe-to-config -------------------------------- */}
                <div className="flex flex-col gap-2 rounded-block border-2 border-brand-200 bg-brand-50/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Label htmlFor="ai-prompt" className="text-sm font-semibold">
                        Describe your app ✨
                      </Label>
                      <p className="text-xs text-paper-600">
                        Write what the app should do in plain English — we&apos;ll fill the
                        JSON below. You can still edit it before creating.
                      </p>
                    </div>
                  </div>
                  <Textarea
                    id="ai-prompt"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={3}
                    placeholder="e.g. A bug tracker with bugs (title, description, severity, status, assignee), a dashboard with counts by status, a form to file new bugs, and a table of all bugs."
                    spellCheck
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-paper-500">
                      {aiBusy
                        ? 'Generating…'
                        : aiIssueCount !== null
                          ? aiIssueCount > 0
                            ? `Config generated with ${aiIssueCount} normalization note(s). Review below.`
                            : 'Config generated. Review below and click Create app.'
                          : ''}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      loading={aiBusy}
                      onClick={handleGenerate}
                    >
                      Generate with AI
                    </Button>
                  </div>
                  {aiErr && (
                    <div
                      role="alert"
                      className="rounded-block border-2 border-ember-300 bg-ember-50 px-3 py-2 text-xs text-ember-600"
                    >
                      {aiErr}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="config">AppConfig (JSON)</Label>
                    <button
                      type="button"
                      className="text-xs font-semibold text-brand-600 hover:underline"
                      onClick={() => setConfigJson(JSON.stringify(STARTER_CONFIG, null, 2))}
                    >
                      Reset to starter
                    </button>
                  </div>
                  <Textarea
                    id="config"
                    value={configJson}
                    onChange={(e) => setConfigJson(e.target.value)}
                    rows={16}
                    spellCheck={false}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-paper-500">
                    Anything malformed will be auto-normalized server-side — unknown field
                    types, bad widgets, and dangling references are dropped with warnings.
                  </p>
                </div>

                {createErr && (
                  <div
                    role="alert"
                    className="rounded-block border-3 border-ember-300 bg-ember-50 px-4 py-3 text-sm text-ember-600"
                  >
                    {createErr}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button type="submit" loading={creating}>
                    Create app
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </section>
      </main>
    </AppShell>
  );
}
