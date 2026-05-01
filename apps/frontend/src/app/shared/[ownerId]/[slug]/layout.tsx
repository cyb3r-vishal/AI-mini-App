'use client';

/**
 * Public, read-only runner shell.
 *
 * Mirrors the authenticated `/apps/[id]` layout but:
 *   - Loads via the unauthenticated `/public/*` endpoints.
 *   - Hides auth-gated chrome (notifications, sign-out, full app nav).
 *   - Renders a clear "read-only" header + "View on AppGen" link.
 *
 * Guests can navigate dashboard/table pages. Form pages are rendered as
 * "submission disabled" stubs by the PublicFormPage renderer.
 */

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { AppConfig, Page, PublicApp } from '@ai-gen/shared';
import {
  Badge,
  Card,
  CardBody,
  ErrorState,
  Skeleton,
} from '@/components/ui';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import {
  DataSourceContext,
  createPublicDataSource,
} from '@/registry/data-source';
import {
  AppRunnerContext,
  type AppRunnerCtx,
} from '../../../apps/[id]/_runner-context';

export default function SharedRunnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ ownerId: string; slug: string }>();
  const pathname = usePathname();
  const ownerId = params.ownerId;
  const slug = params.slug;

  const [app, setApp] = useState<PublicApp | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useMemo(
    () => async () => {
      if (!ownerId || !slug) return;
      setLoading(true);
      setError(null);
      try {
        const [a, c] = await Promise.all([
          api.public.getApp(ownerId, slug),
          api.public.getConfig(ownerId, slug),
        ]);
        setApp(a);
        setConfig(c);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load app');
      } finally {
        setLoading(false);
      }
    },
    [ownerId, slug],
  );

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <SharedShell title="Loading…">
        <Skeleton className="h-6 w-48" />
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </SharedShell>
    );
  }

  if (error || !app || !config) {
    return (
      <SharedShell>
        <ErrorState
          title="This app isn't available"
          message={
            error ??
            'It may have been made private, renamed, or deleted by its owner.'
          }
        />
      </SharedShell>
    );
  }

  // Stub reload — public ctx has nothing to refresh.
  const ctxValue: AppRunnerCtx = { app, config, reload: async () => {} };
  const dataSource = createPublicDataSource(ownerId, slug);

  const basePath = `/shared/${ownerId}/${slug}`;
  // Hide form pages from public navigation: guests can't submit them anyway.
  const visiblePages = config.pages.filter((p) => p.type !== 'form');

  return (
    <AppRunnerContext.Provider value={ctxValue}>
     <DataSourceContext.Provider value={dataSource}>
      <SharedShell title={<SharedTitle name={app.name} />}>
        <div className="flex flex-col gap-5">
          <ReadOnlyNotice />

          <Card>
            <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-xl leading-tight sm:text-2xl">
                    {app.name}
                  </h1>
                  <Badge tone="brand">Public</Badge>
                  <Badge tone="neutral">v{app.activeConfigVersion ?? '?'}</Badge>
                </div>
                {config.description && (
                  <p className="mt-2 text-sm text-paper-600">
                    {config.description}
                  </p>
                )}
              </div>
            </CardBody>
          </Card>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
            <aside className="md:sticky md:top-[5.5rem] md:h-fit">
              <Card>
                <CardBody className="p-2">
                  <nav
                    aria-label="App pages"
                    className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible"
                  >
                    {visiblePages.length === 0 ? (
                      <p className="px-2 py-1.5 text-xs text-paper-500">
                        No public pages in this app.
                      </p>
                    ) : (
                      visiblePages.map((page) => (
                        <SidebarLink
                          key={page.key}
                          page={page}
                          href={`${basePath}/${page.key}`}
                          active={pathname === `${basePath}/${page.key}`}
                        />
                      ))
                    )}
                  </nav>
                </CardBody>
              </Card>
            </aside>

            <section className="min-w-0">{children}</section>
          </div>
        </div>
      </SharedShell>
     </DataSourceContext.Provider>
    </AppRunnerContext.Provider>
  );
}

// ---------- Shared chrome ---------------------------------------------------

function SharedShell({
  title,
  children,
}: {
  title?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bk-dark-app bk-paper-bg flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b-3 border-paper-700 bg-paper-50/95 backdrop-blur supports-[backdrop-filter]:bg-paper-50/80">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-display text-sm tracking-tight sm:text-base"
            >
              <span
                aria-hidden
                className="inline-flex h-7 w-7 items-center justify-center rounded-block border-2 border-brand-300 bg-brand-500 text-2xs text-night-900"
              >
                AI
              </span>
              AppGen
            </Link>
            {title && <span className="hidden sm:inline text-paper-500">·</span>}
            {title && (
              <span className="min-w-0 truncate text-sm text-paper-700">
                {title}
              </span>
            )}
          </div>
          <Link
            href="/signup"
            className="rounded-block border-3 border-brand-300 bg-brand-400 px-3 py-1.5 text-2xs font-semibold uppercase tracking-wider text-night-900 shadow-block-sm hover:bg-brand-300"
          >
            Build your own
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6 sm:py-6">
        {children}
      </main>
    </div>
  );
}

function SharedTitle({ name }: { name: string }) {
  return <span className="truncate font-medium text-paper-900">{name}</span>;
}

function ReadOnlyNotice() {
  return (
    <div
      role="note"
      className="flex flex-wrap items-center gap-2 rounded-block border-2 border-sky-400/40 bg-sky-500/10 px-3 py-2 text-xs text-sky-200"
    >
      <svg viewBox="0 0 20 20" aria-hidden className="h-4 w-4" fill="currentColor">
        <path d="M10 2a8 8 0 1 0 .001 16.001A8 8 0 0 0 10 2Zm.75 12h-1.5v-5h1.5v5Zm0-7h-1.5V5.5h1.5V7Z" />
      </svg>
      <span>
        You&apos;re viewing a public, read-only snapshot. Forms, creates,
        edits, and deletes are disabled.
      </span>
    </div>
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
      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-paper-500">
        •
      </span>
      <span className="min-w-0 flex-1 truncate text-left">{page.title}</span>
    </Link>
  );
}
