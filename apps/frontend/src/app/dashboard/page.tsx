'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { PublicApp } from '@ai-gen/shared';
import { AppShell } from '@/components/app-shell';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Skeleton,
} from '@/components/ui';
import { useNotifications } from '@/hooks/use-notifications';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/cn';

/**
 * /dashboard
 *
 * Main landing page once the user is signed in. Mirrors the visual
 * language of the marketing home page (gradient headline, dark hero
 * strip, feature tiles) while staying inside the authenticated
 * paper-tone shell.
 *
 * What it shows:
 *  - Welcome hero with stats aggregated from /apps and /notifications
 *  - Quick-action grid (Create app, Import CSV, Forms, Tables, etc.)
 *  - Recent apps (linked to their runtime)
 *  - "What's included" feature strip
 *  - Account info
 *
 * All cards degrade gracefully: loading → skeletons, empty → empty-state,
 * errors are swallowed with friendly fallbacks (non-blocking).
 */
export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const n = useNotifications({ enabled: isAuthenticated, pageSize: 5 });

  const [apps, setApps] = useState<PublicApp[] | null>(null);
  const [appsError, setAppsError] = useState<string | null>(null);

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
          setAppsError(err instanceof Error ? err.message : 'Failed to load apps');
          setApps([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const published = useMemo(
    () => (apps ?? []).filter((a) => a.status === 'PUBLISHED').length,
    [apps],
  );
  const drafts = useMemo(
    () => (apps ?? []).filter((a) => a.status === 'DRAFT').length,
    [apps],
  );

  if (isLoading || !user) {
    return (
      <main className="bk-paper-bg flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="inline-flex h-10 w-10 animate-spin items-center justify-center rounded-block border-3 border-paper-700 bg-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-brand-500" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
            </svg>
          </span>
          <p className="text-sm text-paper-600">Loading your workspace…</p>
        </div>
      </main>
    );
  }

  return (
    <AppShell>
      {/* --- Hero strip (dark, marketing-style) ------------------------ */}
      <section className="relative isolate overflow-hidden border-b-3 border-paper-700 bg-night-900 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-grid-night bg-grid-24 opacity-40 [mask-image:radial-gradient(ellipse_at_top,black_15%,transparent_75%)]"
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-radial-spot" />
        <div
          aria-hidden
          className="pointer-events-none absolute left-[-120px] top-[-120px] -z-10 h-[320px] w-[460px] rounded-full bg-brand-500/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-80px] bottom-[-140px] -z-10 h-[300px] w-[400px] rounded-full bg-sky-500/20 blur-3xl"
        />

        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-2xl flex-col gap-3">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-night-100 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
              Signed in as {user.email}
            </span>
            <h1 className="font-display text-3xl leading-[1.05] tracking-tight sm:text-5xl">
              Welcome{user.name ? <>, <span className="bg-gradient-to-r from-brand-300 via-sky-300 to-sun-200 bg-clip-text text-transparent">{user.name}</span></> : <> back</>}
            </h1>
            <p className="max-w-xl text-sm text-night-200 sm:text-base">
              This is your command center. Create apps from JSON configs, import
              CSVs, manage records, and wire up notifications — all without
              writing a line of backend code.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/apps"
              className="inline-flex items-center justify-center gap-2 rounded-block border-3 border-brand-300 bg-brand-400 px-5 py-3 text-sm font-semibold text-night-900 shadow-[0_3px_0_0_rgba(0,0,0,0.45)] transition-transform hover:bg-brand-300 active:translate-y-[2px]"
            >
              <PlusIcon />
              Create an app
            </Link>
            <Link
              href="/import"
              className="inline-flex items-center justify-center gap-2 rounded-block border-3 border-white/20 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/[0.08]"
            >
              <UploadIcon />
              Import CSV
            </Link>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative border-t border-white/10 bg-night-950/60 backdrop-blur">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-px bg-white/10 sm:grid-cols-4">
            <StatCell
              label="Apps"
              value={apps === null ? null : apps.length}
              hint={`${published} published · ${drafts} drafts`}
              icon={<AppsIcon />}
            />
            <StatCell
              label="Published"
              value={apps === null ? null : published}
              hint="Live runtimes"
              icon={<CheckIcon />}
              accent="brand"
            />
            <StatCell
              label="Unread alerts"
              value={n.isLoading ? null : n.unreadCount}
              hint={`${n.total} total events`}
              icon={<BellIcon />}
              accent={n.unreadCount > 0 ? 'ember' : 'neutral'}
            />
            <StatCell
              label="Member since"
              value={new Date(user.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                year: 'numeric',
              })}
              hint={user.role === 'ADMIN' ? 'Admin' : 'Owner'}
              icon={<UserIcon />}
              accent="sky"
              asText
            />
          </div>
        </div>
      </section>

      {/* --- Body ------------------------------------------------------- */}
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-12">
        {/* Quick actions */}
        <section>
          <SectionHeader
            eyebrow="Jump in"
            title="Quick actions"
            subtitle="Everything you'd do in a normal workday, one click away."
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_ACTIONS.map((a) => (
              <QuickActionTile key={a.href} {...a} />
            ))}
          </div>
        </section>

        {/* Recent apps */}
        <section>
          <SectionHeader
            eyebrow="Your workspace"
            title="Recent apps"
            subtitle="Each app runs from its own JSON config — edit, republish, iterate."
            action={
              <Link href="/apps">
                <Button variant="outline" size="sm">
                  View all
                </Button>
              </Link>
            }
          />

          {apps === null ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
          ) : apps.length === 0 ? (
            <EmptyState
              tone="sun"
              title="No apps yet"
              description={
                appsError
                  ? `Couldn't load your apps (${appsError}). Try creating one to get started.`
                  : 'Create your first config-driven app to see the runtime in action.'
              }
              action={
                <Link href="/apps">
                  <Button>Create an app</Button>
                </Link>
              }
            />
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {apps.slice(0, 6).map((app) => (
                <li key={app.id}>
                  <Link href={`/apps/${app.id}`} className="block h-full">
                    <Card
                      interactive
                      className="h-full"
                      tone={app.status === 'PUBLISHED' ? 'default' : 'sunken'}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="truncate">{app.name}</CardTitle>
                          <Badge
                            tone={
                              app.status === 'PUBLISHED'
                                ? 'brand'
                                : app.status === 'DRAFT'
                                ? 'sky'
                                : 'neutral'
                            }
                          >
                            {app.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardBody>
                        <p className="line-clamp-2 text-sm text-paper-600 min-h-[2.5rem]">
                          {app.description ?? 'No description'}
                        </p>
                        <p className="mt-3 text-2xs font-mono uppercase tracking-wider text-paper-400">
                          /{app.slug} · v{app.activeConfigVersion ?? '?'}
                        </p>
                      </CardBody>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Activity + Account */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <SectionHeader
              eyebrow="Live"
              title="Recent activity"
              subtitle="Events emitted by the runtime — record created, updated, deleted."
              action={
                <Link href="/notifications">
                  <Button variant="outline" size="sm">
                    Open inbox
                  </Button>
                </Link>
              }
            />
            <Card>
              <CardBody className="p-0">
                {n.isLoading ? (
                  <div className="flex flex-col gap-3 p-5">
                    <Skeleton className="h-12" />
                    <Skeleton className="h-12" />
                    <Skeleton className="h-12" />
                  </div>
                ) : n.items.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <p className="text-sm text-paper-500">
                      Nothing happened yet. Create or edit a record in one of
                      your apps to see events appear here.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-paper-200">
                    {n.items.slice(0, 5).map((ev) => (
                      <li
                        key={ev.id}
                        className={cn(
                          'flex items-start gap-3 px-5 py-3 transition-colors',
                          !ev.readAt && 'bg-brand-50/40',
                        )}
                      >
                        <Badge
                          tone={
                            ev.type === 'RECORD_CREATED'
                              ? 'brand'
                              : ev.type === 'RECORD_UPDATED'
                              ? 'sky'
                              : ev.type === 'RECORD_DELETED'
                              ? 'ember'
                              : 'sun'
                          }
                        >
                          {ev.type.replace('RECORD_', '').toLowerCase()}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'truncate text-sm',
                              !ev.readAt ? 'font-semibold text-paper-900' : 'text-paper-700',
                            )}
                          >
                            {ev.title}
                          </p>
                          {ev.message && (
                            <p className="truncate text-xs text-paper-500">
                              {ev.message}
                            </p>
                          )}
                        </div>
                        <time className="shrink-0 text-2xs uppercase tracking-wider text-paper-400">
                          {timeAgo(ev.createdAt)}
                        </time>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>

          <div>
            <SectionHeader eyebrow="Profile" title="Account" />
            <Card>
              <CardBody className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div
                    aria-hidden
                    className="flex h-12 w-12 items-center justify-center rounded-block border-3 border-paper-700 bg-brand-400 font-display text-lg text-night-900 shadow-block-sm"
                  >
                    {(user.name ?? user.email).slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-paper-900">
                      {user.name ?? user.email.split('@')[0]}
                    </p>
                    <p className="truncate text-xs text-paper-500">{user.email}</p>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-3 border-t-3 border-paper-100 pt-4 text-sm">
                  <Info label="Role" value={user.role} />
                  <Info
                    label="Joined"
                    value={new Date(user.createdAt).toLocaleDateString()}
                  />
                  <Info
                    label="User ID"
                    value={<code className="font-mono text-xs">{user.id.slice(0, 8)}…</code>}
                  />
                  <Info label="Plan" value="Free" />
                </dl>
              </CardBody>
            </Card>
          </div>
        </section>

        {/* What's included (mirrors marketing Features strip) */}
        <section>
          <SectionHeader
            eyebrow="Platform"
            title="What's included"
            subtitle="Every app on your account gets these out of the box."
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {INCLUDED.map((x) => (
              <Card key={x.title} tone={x.tone} className="h-full">
                <CardBody className="flex flex-col gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-block border-3 border-paper-700 bg-white shadow-block-sm">
                    {x.icon}
                  </span>
                  <h3 className="font-semibold text-paper-900">{x.title}</h3>
                  <p className="text-sm text-paper-600">{x.body}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}

/* ====================================================================== *
 * Bits
 * ====================================================================== */

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-4 flex flex-col gap-2 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-2xs font-semibold uppercase tracking-[0.22em] text-brand-600">
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-xl tracking-tight text-paper-900 sm:text-2xl">
          {title}
        </h2>
        {subtitle && <p className="text-sm text-paper-600">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

function StatCell({
  label,
  value,
  hint,
  icon,
  accent = 'neutral',
  asText,
}: {
  label: string;
  value: number | string | null;
  hint?: string;
  icon: React.ReactNode;
  accent?: 'brand' | 'sky' | 'ember' | 'neutral';
  asText?: boolean;
}) {
  const accentClass: Record<string, string> = {
    brand: 'text-brand-300',
    sky: 'text-sky-300',
    ember: 'text-ember-300',
    neutral: 'text-night-100',
  };
  return (
    <div className="bg-night-900 px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex items-center gap-2">
        <span className={cn('inline-flex h-5 w-5 items-center justify-center', accentClass[accent])}>
          {icon}
        </span>
        <span className="text-2xs font-semibold uppercase tracking-[0.22em] text-night-400">
          {label}
        </span>
      </div>
      <p
        className={cn(
          'mt-1 font-display leading-none text-white',
          asText ? 'text-base sm:text-lg' : 'text-2xl sm:text-3xl',
        )}
      >
        {value === null ? <span className="inline-block h-6 w-12 animate-pulse rounded bg-white/10" /> : value}
      </p>
      {hint && <p className="mt-1 text-xs text-night-300">{hint}</p>}
    </div>
  );
}

function QuickActionTile({
  href,
  title,
  body,
  icon,
  tone,
}: {
  href: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  tone: 'brand' | 'sky' | 'sun' | 'ember' | 'default';
}) {
  return (
    <Link href={href} className="group block h-full">
      <Card interactive tone={tone === 'default' ? 'default' : tone} className="h-full">
        <CardBody className="flex h-full flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-block border-3 border-paper-700 bg-white shadow-block-sm">
              {icon}
            </span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              className="h-4 w-4 text-paper-400 transition-transform group-hover:translate-x-0.5 group-hover:text-paper-900"
            >
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-paper-900">{title}</h3>
            <p className="mt-0.5 text-sm text-paper-600">{body}</p>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-2xs font-semibold uppercase tracking-wider text-paper-500">
        {label}
      </dt>
      <dd className="truncate font-medium text-paper-900">{value}</dd>
    </div>
  );
}

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return '';
  const diff = Date.now() - d;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d`;
  return new Date(iso).toLocaleDateString();
}

/* ====================================================================== *
 * Data
 * ====================================================================== */

const QUICK_ACTIONS: {
  href: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  tone: 'brand' | 'sky' | 'sun' | 'ember' | 'default';
}[] = [
  {
    href: '/apps',
    title: 'Create a new app',
    body: 'Start from a JSON config or one of our starters.',
    icon: <PlusIcon />,
    tone: 'brand',
  },
  {
    href: '/import',
    title: 'Import a CSV',
    body: 'Upload, auto-map columns to fields, and bulk insert.',
    icon: <UploadIcon />,
    tone: 'sky',
  },
  {
    href: '/tables',
    title: 'Browse tables',
    body: 'Live CRUD tables generated from your entities.',
    icon: <TableIcon />,
    tone: 'default',
  },
  {
    href: '/forms',
    title: 'Try the dynamic form',
    body: 'Render a form from any entity — validation included.',
    icon: <FormIcon />,
    tone: 'default',
  },
  {
    href: '/notifications',
    title: 'Check your inbox',
    body: 'Event-based notifications for every record change.',
    icon: <BellIcon />,
    tone: 'sun',
  },
  {
    href: '/registry',
    title: 'Component registry',
    body: 'Extend the runtime with your own fields & widgets.',
    icon: <BlocksIcon />,
    tone: 'default',
  },
];

const INCLUDED: {
  title: string;
  body: string;
  tone: 'default' | 'brand' | 'sky' | 'sun' | 'ember';
  icon: React.ReactNode;
}[] = [
  {
    title: 'Auth & sessions',
    body: 'JWT access tokens + refresh-token rotation, user-scoped data.',
    tone: 'default',
    icon: <LockIcon />,
  },
  {
    title: 'Dynamic CRUD',
    body: 'REST endpoints + validation generated from each entity.',
    tone: 'default',
    icon: <ServerIcon />,
  },
  {
    title: 'CSV import',
    body: 'Upload → map → validate → commit, with per-row errors.',
    tone: 'default',
    icon: <UploadIcon />,
  },
  {
    title: 'Notifications',
    body: 'Event bus fires transactional alerts — no setup required.',
    tone: 'default',
    icon: <BellIcon />,
  },
];

/* ====================================================================== *
 * Icons (tiny inline SVGs)
 * ====================================================================== */

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className="h-5 w-5">
      <path d="M12 16V4m0 0-4 4m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function AppsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className="h-4 w-4">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4">
      <path d="M5 12l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 21a2 2 0 0 0 4 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" />
    </svg>
  );
}
function TableIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18M9 4v16" />
    </svg>
  );
}
function FormIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 9h10M7 13h6M7 17h4" strokeLinecap="round" />
    </svg>
  );
}
function BlocksIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="8" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
      <path d="M17 13v8m-4-4h8" strokeLinecap="round" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" />
    </svg>
  );
}
function ServerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <rect x="3" y="4" width="18" height="7" rx="2" />
      <rect x="3" y="13" width="18" height="7" rx="2" />
      <circle cx="7" cy="7.5" r="0.8" fill="currentColor" />
      <circle cx="7" cy="16.5" r="0.8" fill="currentColor" />
    </svg>
  );
}
