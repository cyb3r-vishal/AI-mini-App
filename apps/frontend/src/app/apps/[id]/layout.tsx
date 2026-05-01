'use client';

/**
 * /apps/[id] layout — app-runner shell.
 *
 * Loads the app's active config once, builds a left-rail nav from
 * `config.pages`, and renders child routes inside a responsive shell.
 *
 * Context is exposed via a React context so any descendant (route,
 * breadcrumb, deep-linked component) can read the current config
 * without another round-trip to the API.
 */

import Link from 'next/link';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { AppConfig, Page, PublicApp } from '@ai-gen/shared';
import { AppShell } from '@/components/app-shell';
import { SharePopover } from '@/components/share-popover';
import {
  Badge,
  Button,
  Card,
  CardBody,
  ErrorState,
  Skeleton,
} from '@/components/ui';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/cn';
import {
  DataSourceContext,
  createOwnerDataSource,
} from '@/registry/data-source';
import { AppRunnerContext, type AppRunnerCtx } from './_runner-context';

// ---------- Layout ----------------------------------------------------------

export default function AppRunnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const appId = params.id;

  const [app, setApp] = useState<PublicApp | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gate on auth.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  // Load app + config in parallel.
  const load = useMemo(
    () => async () => {
      if (!appId) return;
      setLoading(true);
      setError(null);
      try {
        const [a, c] = await Promise.all([
          api.apps.get(appId),
          api.apps.getConfig(appId),
        ]);
        setApp(a);
        setConfig(c);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load app');
      } finally {
        setLoading(false);
      }
    },
    [appId],
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    void load();
  }, [isAuthenticated, load]);

  // Loading
  if (authLoading || loading) {
    return (
      <AppShell title={<span className="truncate">Loading app…</span>}>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <Skeleton className="h-6 w-40" />
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </main>
      </AppShell>
    );
  }

  if (error || !app || !config) {
    return (
      <AppShell>
        <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <ErrorState
            title="Couldn't open this app"
            message={error ?? 'App or its active config is missing.'}
            onRetry={() => void load()}
          />
        </main>
      </AppShell>
    );
  }

  const ctxValue: AppRunnerCtx = { app, config, reload: load };

  // Pick the first form page so the "+ Add record" shortcut actually lands
  // somewhere useful. Falls back to the first page.
  const firstForm = config.pages.find((p) => p.type === 'form');
  const addRecordHref = firstForm
    ? `/apps/${app.id}/${firstForm.key}`
    : undefined;

  const dataSource = createOwnerDataSource(app.id);

  return (
    <AppRunnerContext.Provider value={ctxValue}>
     <DataSourceContext.Provider value={dataSource}>
      <AppShell title={<AppTitleBadge name={app.name} slug={app.slug} />}>
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6">
          {/* ----- App Hero ------------------------------------------------ */}
          <AppHero
            app={app}
            config={config}
            onAppChange={setApp}
            addRecordHref={addRecordHref}
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
            {/* Sidebar (desktop) + top scroller (mobile) */}
            <aside className="md:sticky md:top-[5.5rem] md:h-fit">
              <Card>
                <CardBody className="p-2">
                  <nav
                    aria-label="App pages"
                    className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible"
                  >
                    {config.pages.length === 0 ? (
                      <p className="px-2 py-1.5 text-xs text-paper-500">
                        This app has no pages yet.
                      </p>
                    ) : (
                      config.pages.map((page) => (
                        <SidebarLink
                          key={page.key}
                          page={page}
                          href={`/apps/${app.id}/${page.key}`}
                          active={pathname === `/apps/${app.id}/${page.key}`}
                        />
                      ))
                    )}
                  </nav>
                </CardBody>
              </Card>

              <div className="mt-3 hidden md:block">
                <ConfigMeta config={config} version={app.activeConfigVersion} />
              </div>
            </aside>

            <section className="min-w-0">{children}</section>
          </div>
        </div>
      </AppShell>
     </DataSourceContext.Provider>
    </AppRunnerContext.Provider>
  );
}

// ---------- App Hero --------------------------------------------------------

function AppHero({
  app,
  config,
  onAppChange,
  addRecordHref,
}: {
  app: PublicApp;
  config: AppConfig;
  onAppChange: (next: PublicApp) => void;
  addRecordHref: string | undefined;
}) {
  return (
    <Card tone="default" elevation="block">
      <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-xl leading-tight sm:text-2xl">
              {app.name}
            </h1>
            <Badge tone={app.isPublic ? 'brand' : 'neutral'}>
              {app.isPublic ? 'Public' : 'Private'}
            </Badge>
            <Badge tone="neutral">
              v{app.activeConfigVersion ?? '?'}
            </Badge>
          </div>
          {config.description && (
            <p className="mt-2 text-sm text-paper-600">{config.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-paper-500">
            <span>
              <strong className="text-paper-700">{config.entities.length}</strong>{' '}
              {config.entities.length === 1 ? 'entity' : 'entities'}
            </span>
            <span>
              <strong className="text-paper-700">{config.pages.length}</strong>{' '}
              {config.pages.length === 1 ? 'page' : 'pages'}
            </span>
            <span>
              Updated {formatRelative(app.updatedAt)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {addRecordHref && (
            <Link href={addRecordHref}>
              <Button size="sm" leftIcon={<PlusIcon />}>
                Add record
              </Button>
            </Link>
          )}
          <SharePopover app={app} onChange={onAppChange} />
        </div>
      </CardBody>
    </Card>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path d="M10 4v12M4 10h12" strokeLinecap="square" />
    </svg>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (diffSec < 60) return 'just now';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ---------- Bits ------------------------------------------------------------

function AppTitleBadge({ name, slug }: { name: string; slug: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Link href="/apps" className="text-xs text-paper-500 hover:underline">
        ← Apps
      </Link>
      <span className="truncate font-display text-sm sm:text-base">{name}</span>
      <Badge tone="neutral" className="hidden sm:inline-flex">
        {slug}
      </Badge>
    </span>
  );
}

function SidebarLink({
  page,
  href,
  active,
}: {
  page: Page;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex shrink-0 items-center gap-2 rounded-block border-3 px-3 py-1.5 text-sm font-medium transition-colors',
        'md:w-full',
        active
          ? 'border-paper-700 bg-paper-900 text-white shadow-block-sm'
          : 'border-transparent text-paper-700 hover:bg-paper-100',
      )}
    >
      <PageIcon type={page.type} className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-left">{page.title}</span>
    </Link>
  );
}

function PageIcon({
  type,
  className,
}: {
  type: Page['type'];
  className?: string;
}) {
  const shared = 'fill-none stroke-current';
  const props = { className: cn(shared, className), strokeWidth: 2 };
  switch (type) {
    case 'dashboard':
      return (
        <svg viewBox="0 0 20 20" aria-hidden {...props}>
          <rect x="3" y="3" width="6" height="8" />
          <rect x="11" y="3" width="6" height="4" />
          <rect x="3" y="13" width="6" height="4" />
          <rect x="11" y="9" width="6" height="8" />
        </svg>
      );
    case 'form':
      return (
        <svg viewBox="0 0 20 20" aria-hidden {...props}>
          <rect x="3" y="4" width="14" height="12" rx="1" />
          <path d="M6 8h8M6 11h8M6 14h5" strokeLinecap="square" />
        </svg>
      );
    case 'table':
      return (
        <svg viewBox="0 0 20 20" aria-hidden {...props}>
          <rect x="3" y="4" width="14" height="12" />
          <path d="M3 8h14M3 12h14M9 4v12" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 20 20" aria-hidden {...props}>
          <circle cx="10" cy="10" r="6" />
        </svg>
      );
  }
}

function ConfigMeta({
  config,
  version,
}: {
  config: AppConfig;
  version: number | null;
}) {
  return (
    <Card>
      <CardBody className="flex flex-col gap-2 text-xs text-paper-600">
        <div className="flex items-center justify-between">
          <span className="uppercase tracking-wider text-paper-500">Config</span>
          <Badge tone="neutral">v{version ?? '?'}</Badge>
        </div>
        <p>
          <span className="text-paper-500">Entities:</span>{' '}
          {config.entities.length}
        </p>
        <p>
          <span className="text-paper-500">Pages:</span> {config.pages.length}
        </p>
        {config.description && (
          <p className="line-clamp-3 pt-1 text-paper-600">{config.description}</p>
        )}
      </CardBody>
    </Card>
  );
}
