import Link from 'next/link';

export function Cta() {
  return (
    <section className="relative overflow-hidden bg-night-900 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid-night bg-grid-24 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[360px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/25 blur-3xl"
      />
      <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-4 py-24 text-center sm:px-6">
        <span className="text-2xs font-semibold uppercase tracking-[0.22em] text-brand-300">
          So, what are we building?
        </span>
        <h2 className="max-w-2xl font-display text-4xl leading-[1.05] tracking-tight text-white sm:text-6xl">
          Your next app is a{' '}
          <span className="bg-gradient-to-r from-brand-300 via-sky-300 to-sun-200 bg-clip-text text-transparent">
            sentence
          </span>{' '}
          away
        </h2>
        <p className="max-w-xl text-night-200">
          Sign up free, describe your idea, and watch the platform do the rest.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-block border-3 border-brand-300 bg-brand-400 px-5 py-3 text-sm font-semibold text-night-900 shadow-[0_3px_0_0_rgba(0,0,0,0.45)] transition-transform hover:bg-brand-300 active:translate-y-[2px] sm:text-base"
          >
            Create your account
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              className="h-4 w-4"
              aria-hidden
            >
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-block border-3 border-white/20 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08] sm:text-base"
          >
            I already have an account
          </Link>
        </div>
      </div>
    </section>
  );
}
