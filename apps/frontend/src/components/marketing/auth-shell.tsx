'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

interface AuthShellProps {
  /** The auth form content. */
  children: ReactNode;
  /** Shown above the form. */
  title: string;
  /** Shown under the title. */
  subtitle?: string;
  /** Tiny eyebrow text over the title (e.g. "Welcome back"). */
  eyebrow?: string;
  /** Links shown at the bottom of the card. */
  footer?: ReactNode;
}

/**
 * Full-screen dark auth shell used by `/login` and `/signup`.
 *
 * Reuses the marketing/landing visual language — night-900 surface,
 * soft brand/sky glows, subtle grid backdrop, gradient headings — so
 * the transition from home → auth feels seamless.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────────┐
 *   │  sticky nav (brand only)                         │
 *   ├──────────────────────┬───────────────────────────┤
 *   │  pitch / testimonial │  auth card (paper)        │
 *   └──────────────────────┴───────────────────────────┘
 *
 * Collapses gracefully to a single column on mobile with the pitch
 * condensed to a header strip.
 */
export function AuthShell({ children, title, subtitle, eyebrow, footer }: AuthShellProps) {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-night-900 text-white">
      {/* --- Background glow + grid ------------------------------------- */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid-night bg-grid-24 opacity-40 [mask-image:radial-gradient(ellipse_at_top,black_15%,transparent_75%)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-radial-spot" />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-180px] top-[-180px] -z-10 h-[420px] w-[520px] rounded-full bg-brand-500/25 blur-3xl animate-blob-drift"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-160px] right-[-120px] -z-10 h-[360px] w-[420px] rounded-full bg-sky-500/20 blur-3xl animate-blob-drift"
      />

      {/* --- Minimal top nav -------------------------------------------- */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6 sm:py-6">
        <Link href="/" className="flex items-center gap-2 font-display text-lg text-white">
          <span
            aria-hidden
            className="inline-flex h-8 w-8 items-center justify-center rounded-block border-2 border-brand-300 bg-brand-500 text-sm text-night-900 shadow-[0_3px_0_0_rgba(0,0,0,0.4)]"
          >
            AI
          </span>
          <span className="hidden sm:inline">AI App Generator</span>
        </Link>

        <Link
          href="/"
          className="rounded-block px-3 py-1.5 text-sm font-medium text-night-100 transition-colors hover:bg-white/5 hover:text-white"
        >
          ← Back to home
        </Link>
      </header>

      {/* --- Body grid --------------------------------------------------- */}
      <main className="relative z-10 mx-auto grid w-full max-w-6xl gap-8 px-4 pb-10 sm:px-6 sm:pb-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-24">
        {/* Left: pitch */}
        <section className="flex flex-col justify-center gap-8">
          <div className="flex flex-col gap-5">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-night-100 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
              Config-driven app runtime
            </span>
            <h1 className="max-w-xl font-display text-4xl leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
              Turn your ideas into{' '}
              <span className="bg-gradient-to-r from-brand-300 via-sky-300 to-sun-200 bg-clip-text text-transparent">
                apps
              </span>
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-night-200 sm:text-lg">
              Pages, forms, tables, auth, database, and imports — all generated
              from a single JSON config. Sign in to start building.
            </p>
          </div>

          <ul className="hidden max-w-md flex-col gap-3 text-sm text-night-100 lg:flex">
            {[
              ['JWT auth with refresh-token rotation'],
              ['Dynamic CRUD API per entity, with validation'],
              ['CSV import — upload, map, and bulk insert'],
              ['Event-based notifications out of the box'],
              ['Extensible field & widget registries'],
            ].map(([t]) => (
              <li key={t} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-block border-2 border-brand-300 bg-brand-500/20 text-brand-300"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-3 w-3">
                    <path d="M5 12l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {t}
              </li>
            ))}
          </ul>
        </section>

        {/* Right: auth card */}
        <section className="flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="relative rounded-block-xl border-3 border-white/15 bg-night-800/80 p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] backdrop-blur sm:p-8">
              <div aria-hidden className="pointer-events-none absolute -inset-px rounded-block-xl bg-gradient-to-b from-white/[0.04] to-transparent" />
              <div className="relative flex flex-col gap-6">
                <header className="flex flex-col gap-2">
                  {eyebrow && (
                    <p className="text-2xs font-semibold uppercase tracking-[0.22em] text-brand-300">
                      {eyebrow}
                    </p>
                  )}
                  <h2 className="font-display text-2xl leading-tight text-white sm:text-3xl">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-sm text-night-200">{subtitle}</p>
                  )}
                </header>

                <div className="flex flex-col gap-4">{children}</div>

                {footer && (
                  <div className="border-t border-white/10 pt-4 text-center text-sm text-night-200">
                    {footer}
                  </div>
                )}
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-night-400">
              By continuing you agree to our Terms and Privacy.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
