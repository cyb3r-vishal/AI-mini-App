'use client';

import { useEffect, useRef, useState } from 'react';
import type { PublicApp } from '@ai-gen/shared';
import { Button } from '@/components/ui';
import { ApiError, api } from '@/lib/api-client';
import { cn } from '@/lib/cn';

export interface SharePopoverProps {
  app: PublicApp;
  /** Called after the backend toggle succeeds. Receives the fresh app. */
  onChange?: (next: PublicApp) => void;
}

/**
 * <SharePopover />
 *
 * Small dropdown anchored to a "Share" button. Lets the owner toggle the
 * app's public visibility and copy a shareable URL that works for any
 * guest (no login required).
 *
 * URL format: `/shared/<ownerId>/<slug>` — resolves via the public REST
 * endpoints exposed by the backend at `/public/apps/:ownerId/:slug`.
 */
export function SharePopover({ app, onChange }: SharePopoverProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Click-outside to close.
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const shareUrl =
    typeof window === 'undefined'
      ? ''
      : `${window.location.origin}/shared/${app.ownerId}/${app.slug}`;

  async function toggle(next: boolean) {
    setBusy(true);
    setErr(null);
    try {
      const updated = await api.apps.setVisibility(app.id, next);
      onChange?.(updated);
    } catch (e) {
      setErr(
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Failed to update visibility',
      );
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore — browsers without clipboard permission */
    }
  }

  return (
    <div ref={ref} className="relative">
      <Button
        size="sm"
        variant={app.isPublic ? 'primary' : 'outline'}
        onClick={() => setOpen((v) => !v)}
        leftIcon={<ShareIcon />}
      >
        {app.isPublic ? 'Shared' : 'Share'}
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Share this app"
          className={cn(
            'absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))]',
            'rounded-block-lg border-3 border-paper-700 bg-white p-4 shadow-block-lg',
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-paper-900">
                {app.isPublic ? 'Anyone with the link' : 'Only you'}
              </p>
              <p className="mt-1 text-xs text-paper-600">
                {app.isPublic
                  ? 'Guests can view dashboards and tables without logging in. They cannot create, edit, or delete records.'
                  : 'Make this app visible to anyone with the link. Guests get read-only access to its dashboards and tables.'}
              </p>
            </div>

            {/* Toggle switch */}
            <button
              type="button"
              role="switch"
              aria-checked={app.isPublic}
              aria-label="Toggle public sharing"
              onClick={() => void toggle(!app.isPublic)}
              disabled={busy}
              className={cn(
                'relative mt-0.5 h-7 w-12 shrink-0 rounded-full border-3 transition-colors',
                app.isPublic
                  ? 'border-brand-700 bg-brand-400'
                  : 'border-paper-700 bg-paper-200',
                busy && 'opacity-50',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-block-sm transition-transform',
                  app.isPublic ? 'translate-x-5' : 'translate-x-0.5',
                )}
              />
            </button>
          </div>

          {err && (
            <div
              role="alert"
              className="mt-3 rounded-block border-2 border-ember-300 bg-ember-50 px-3 py-2 text-xs text-ember-600"
            >
              {err}
            </div>
          )}

          {app.isPublic && (
            <div className="mt-4 flex flex-col gap-2">
              <label className="text-2xs font-semibold uppercase tracking-wider text-paper-500">
                Shareable link
              </label>
              <div className="flex items-stretch gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  className={cn(
                    'min-w-0 flex-1 rounded-block border-3 border-paper-300 bg-paper-50 px-3 py-2',
                    'font-mono text-xs text-paper-800 shadow-inset',
                    'focus:outline-none focus:border-brand-500',
                  )}
                />
                <Button size="sm" variant="outline" onClick={copy}>
                  {copied ? 'Copied ✓' : 'Copy'}
                </Button>
              </div>
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-brand-600 hover:underline"
              >
                Open in new tab ↗
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="5" cy="10" r="2" />
      <circle cx="15" cy="5" r="2" />
      <circle cx="15" cy="15" r="2" />
      <path d="M7 9l6-3M7 11l6 3" strokeLinecap="square" />
    </svg>
  );
}
