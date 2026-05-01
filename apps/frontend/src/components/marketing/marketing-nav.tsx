'use client';

import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/cn';

const links = [
  { href: '/#features', label: 'Features' },
  { href: '/#gallery', label: 'Showcase' },
  { href: '/#faq', label: 'FAQ' },
];

/**
 * Top navigation for marketing pages.
 * Sticky, translucent dark bar with a visible "blur" effect.
 */
export function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-night-900/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg tracking-tight text-white"
        >
          <span
            aria-hidden
            className="inline-flex h-8 w-8 items-center justify-center rounded-block border-2 border-brand-300 bg-brand-500 text-sm text-night-900 shadow-[0_3px_0_0_rgba(0,0,0,0.4)]"
          >
            AI
          </span>
          <span className="hidden sm:inline">AI App Generator</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-block px-3 py-2 text-sm font-medium text-night-200 transition-colors hover:bg-white/5 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="rounded-block px-3 py-2 text-sm font-medium text-night-100 transition-colors hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-block border-3 border-brand-300 bg-brand-400 px-4 py-2 text-sm font-semibold text-night-900 shadow-[0_3px_0_0_rgba(0,0,0,0.45)] transition-transform hover:bg-brand-300 active:translate-y-[2px]"
          >
            Start building
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-block border-2 border-white/15 text-white md:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-5 w-5"
            aria-hidden
          >
            {open ? (
              <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      <div
        className={cn(
          'border-t border-white/10 bg-night-900/95 md:hidden',
          open ? 'block' : 'hidden',
        )}
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-block px-3 py-2 text-sm font-medium text-night-200 hover:bg-white/5 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-block border-2 border-white/15 px-3 py-2 text-center text-sm font-medium text-white"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="rounded-block border-3 border-brand-300 bg-brand-400 px-3 py-2 text-center text-sm font-semibold text-night-900 shadow-[0_3px_0_0_rgba(0,0,0,0.45)]"
            >
              Start
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
