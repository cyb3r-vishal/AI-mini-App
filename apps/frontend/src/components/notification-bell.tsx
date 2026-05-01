'use client';

import { useEffect, useRef, useState } from 'react';
import type { Notification } from '@ai-gen/shared';
import { Badge, Button } from '@/components/ui';
import { useNotifications } from '@/hooks/use-notifications';
import { cn } from '@/lib/cn';

/**
 * <NotificationBell />
 *
 * Dropdown bell for the app chrome. Polls via `useNotifications`; uses the
 * existing API client so auth + refresh are handled automatically.
 *
 * Composes well inside page headers:
 *   <header><NotificationBell /></header>
 */

export interface NotificationBellProps {
  enabled?: boolean;
  className?: string;
}

export function NotificationBell({ enabled = true, className }: NotificationBellProps) {
  const notifs = useNotifications({ enabled });
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on click outside + Esc.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-label={`Notifications${notifs.unreadCount ? ` (${notifs.unreadCount} unread)` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative inline-flex h-11 w-11 items-center justify-center rounded-block border-3 bg-white text-paper-800 shadow-block-sm',
          'border-paper-700 transition-[transform,box-shadow] active:translate-y-[2px] active:shadow-none',
          'focus:outline-none focus-visible:shadow-focus',
        )}
      >
        <BellIcon />
        {notifs.unreadCount > 0 && (
          <span
            aria-hidden
            className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-block border-3 border-paper-900 bg-ember-400 px-1 text-2xs font-bold text-white"
          >
            {notifs.unreadCount > 99 ? '99+' : notifs.unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop on mobile only */}
          <div
            aria-hidden
            className="fixed inset-0 z-40 bg-black/20 sm:hidden"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-label="Notifications"
            className={cn(
              'fixed left-2 right-2 top-20 z-50 rounded-block-lg border-3 border-paper-700 bg-white shadow-block-lg',
              'sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[22rem] sm:max-w-[calc(100vw-2rem)]',
            )}
          >
          <div className="flex flex-col gap-2 border-b-3 border-paper-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-display text-sm text-paper-900">Notifications</p>
            <div className="flex flex-wrap items-center gap-2">
              <FilterToggle
                filter={notifs.filter}
                onChange={notifs.setFilter}
                unread={notifs.unreadCount}
              />
              {notifs.unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => notifs.markRead()}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto sm:max-h-[22rem]">
            {notifs.isLoading && <SkeletonRows />}
            {!notifs.isLoading && notifs.error && (
              <div className="px-4 py-6 text-center text-sm text-ember-600">
                {notifs.error}
              </div>
            )}
            {!notifs.isLoading && !notifs.error && notifs.items.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-paper-500">
                {notifs.filter === 'unread'
                  ? 'No unread notifications.'
                  : 'No notifications yet.'}
              </div>
            )}
            {!notifs.isLoading &&
              !notifs.error &&
              notifs.items.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onMarkRead={() => notifs.markRead([n.id])}
                  onRemove={() => notifs.remove(n.id)}
                />
              ))}
          </div>
          </div>
        </>
      )}
    </div>
  );
}

function FilterToggle({
  filter,
  onChange,
  unread,
}: {
  filter: 'all' | 'unread';
  onChange: (f: 'all' | 'unread') => void;
  unread: number;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-block border-3 border-paper-300">
      <button
        type="button"
        onClick={() => onChange('all')}
        className={cn(
          'px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider',
          filter === 'all' ? 'bg-paper-700 text-white' : 'bg-white text-paper-700',
        )}
      >
        All
      </button>
      <button
        type="button"
        onClick={() => onChange('unread')}
        className={cn(
          'px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider',
          filter === 'unread' ? 'bg-paper-700 text-white' : 'bg-white text-paper-700',
        )}
      >
        Unread {unread > 0 && `(${unread})`}
      </button>
    </div>
  );
}

function NotificationRow({
  notification,
  onMarkRead,
  onRemove,
}: {
  notification: Notification;
  onMarkRead: () => void;
  onRemove: () => void;
}) {
  const unread = !notification.readAt;
  return (
    <div
      className={cn(
        'group flex items-start gap-3 border-b border-paper-100 px-4 py-3',
        unread && 'bg-brand-50/50',
      )}
    >
      <TypeBadge type={notification.type} />
      <button
        type="button"
        onClick={onMarkRead}
        className="min-w-0 flex-1 text-left"
      >
        <p
          className={cn(
            'truncate text-sm',
            unread ? 'font-semibold text-paper-900' : 'text-paper-700',
          )}
        >
          {notification.title}
        </p>
        {notification.message && (
          <p className="truncate text-xs text-paper-500">{notification.message}</p>
        )}
        <p className="mt-1 text-2xs uppercase tracking-wider text-paper-400">
          {formatRelative(notification.createdAt)}
        </p>
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Dismiss"
        className="shrink-0 rounded-block border-3 border-paper-200 p-1 text-paper-500 hover:bg-paper-100"
      >
        <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden>
          <path
            d="M3 3l10 10M13 3L3 13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
            fill="none"
          />
        </svg>
      </button>
    </div>
  );
}

function TypeBadge({ type }: { type: Notification['type'] }) {
  const map: Record<Notification['type'], { tone: 'brand' | 'sky' | 'ember' | 'sun'; label: string }> = {
    RECORD_CREATED: { tone: 'brand', label: 'New' },
    RECORD_UPDATED: { tone: 'sky', label: 'Edit' },
    RECORD_DELETED: { tone: 'ember', label: 'Del' },
    SYSTEM: { tone: 'sun', label: 'Sys' },
  };
  const { tone, label } = map[type];
  return <Badge tone={tone} className="mt-0.5 shrink-0">{label}</Badge>;
}

function SkeletonRows() {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-block border-3 border-paper-100 bg-white p-3"
        >
          <div className="h-5 w-10 animate-pulse rounded-block-sm bg-paper-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 animate-pulse rounded-block-sm bg-paper-200" />
            <div className="h-3 w-1/2 animate-pulse rounded-block-sm bg-paper-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
      <path
        d="M4 8a6 6 0 1 1 12 0v4l1 2H3l1-2z M8 16a2 2 0 0 0 4 0"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const s = Math.round(diffMs / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}
