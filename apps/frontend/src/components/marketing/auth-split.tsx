import Link from 'next/link';

interface AuthSplitProps {
  children: React.ReactNode;
}

/**
 * Dark split layout used by /login and /signup.
 *
 *   ┌───────────────────────────┬──────────────────────────┐
 *   │  Brand / pitch (dark)     │  Auth form (paper)       │
 *   └───────────────────────────┴──────────────────────────┘
 *
 * On mobile the left panel collapses to a small header strip.
 */
export function AuthSplit({ children }: AuthSplitProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Left: pitch panel */}
      <aside className="relative isolate overflow-hidden bg-night-900 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-grid-night bg-grid-24 opacity-50 [mask-image:radial-gradient(ellipse_at_top_left,black_10%,transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-[-120px] top-[-100px] -z-10 h-[360px] w-[480px] rounded-full bg-brand-500/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[-160px] right-[-120px] -z-10 h-[360px] w-[420px] rounded-full bg-sky-500/20 blur-3xl"
        />

        <div className="relative flex h-full flex-col gap-8 px-6 py-8 sm:px-10 lg:justify-between lg:px-14 lg:py-14">
          <Link
            href="/"
            className="flex items-center gap-2 font-display text-lg text-white"
          >
            <span
              aria-hidden
              className="inline-flex h-8 w-8 items-center justify-center rounded-block border-2 border-brand-300 bg-brand-500 text-sm text-night-900 shadow-[0_3px_0_0_rgba(0,0,0,0.4)]"
            >
              AI
            </span>
            AI App Generator
          </Link>

          <div className="hidden flex-col gap-6 lg:flex">
            <h2 className="max-w-md font-display text-4xl leading-[1.1] text-white">
              Turn your ideas into{' '}
              <span className="bg-gradient-to-r from-brand-300 via-sky-300 to-sun-200 bg-clip-text text-transparent">
                apps
              </span>
            </h2>
            <p className="max-w-md text-night-200">
              Describe what you want in plain English — or drop in a JSON
              config — and watch a full app appear: pages, forms, tables,
              auth, and database, all ready to use.
            </p>

            <ul className="flex flex-col gap-3 text-sm text-night-100">
              {[
                'Config-driven runtime — one codebase, any shape',
                'JWT auth with DB-backed sessions and refresh tokens',
                'CSV import with validation & per-row error handling',
                'Event-based notifications out of the box',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    className="mt-0.5 h-4 w-4 shrink-0 text-brand-300"
                    aria-hidden
                  >
                    <path d="M5 12l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <p className="hidden text-xs text-night-400 lg:block">
            © {new Date().getFullYear()} AI App Generator
          </p>
        </div>
      </aside>

      {/* Right: form panel */}
      <section className="bk-paper-bg relative flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </div>
  );
}
