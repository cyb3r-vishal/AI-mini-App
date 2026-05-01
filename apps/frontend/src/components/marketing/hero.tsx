'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const suggestions = [
  'Reporting dashboard',
  'Gaming platform',
  'Onboarding portal',
  'CRM for freelancers',
  'Inventory tracker',
];

const typewriterPhrases = [
  'a CRM for my freelance business',
  'an onboarding portal for new hires',
  'a meal planner with shopping lists',
  'an inventory tracker for my shop',
  'a reporting dashboard for my team',
];

export function Hero() {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // `typewriterPhrases` is a non-empty literal; the modulo always hits a
    // valid index. Fall back to the empty string to satisfy the
    // `noUncheckedIndexedAccess` TS check without a non-null assertion.
    const phrase = typewriterPhrases[i % typewriterPhrases.length] ?? '';
    const speed = deleting ? 25 : 55;
    const t = setTimeout(() => {
      if (!deleting) {
        const next = phrase.slice(0, shown.length + 1);
        setShown(next);
        if (next === phrase) {
          setTimeout(() => setDeleting(true), 1400);
        }
      } else {
        const next = phrase.slice(0, Math.max(0, shown.length - 1));
        setShown(next);
        if (next === '') {
          setDeleting(false);
          setI((v) => v + 1);
        }
      }
    }, speed);
    return () => clearTimeout(t);
  }, [shown, deleting, i]);

  return (
    <section className="relative isolate overflow-hidden border-b border-white/10 bg-night-900 text-white">
      {/* Glow + grid background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid-night bg-grid-24 opacity-60 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-radial-spot"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-120px] -z-10 h-[360px] w-[720px] -translate-x-1/2 rounded-full bg-brand-500/25 blur-3xl animate-blob-drift"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-120px] top-40 -z-10 h-[260px] w-[360px] rounded-full bg-sky-500/20 blur-3xl animate-blob-drift"
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-4 py-20 text-center sm:px-6 sm:py-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-night-100 backdrop-blur animate-fade-up">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
          Config-driven app runtime · open platform
        </span>

        <h1 className="max-w-4xl font-display text-4xl leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl animate-fade-up">
          Turn your ideas into{' '}
          <span className="bg-gradient-to-r from-brand-300 via-sky-300 to-sun-200 bg-clip-text text-transparent">
            apps
          </span>
        </h1>

        <p className="max-w-2xl text-base leading-relaxed text-night-200 sm:text-lg animate-fade-up">
          Describe what you want to build in plain English — or drop in a JSON
          config — and get a working app in minutes. Pages, forms, tables,
          auth, database, and imports, all wired up for you.
        </p>

        {/* Prompt-style CTA */}
        <form
          action="/signup"
          className="w-full max-w-2xl animate-fade-up"
          onSubmit={(e) => {
            e.preventDefault();
            window.location.assign('/signup');
          }}
        >
          <label htmlFor="hero-prompt" className="sr-only">
            Describe your app
          </label>
          <div className="group flex flex-col items-stretch gap-2 rounded-block-xl border-3 border-white/15 bg-night-800/80 p-2 shadow-[0_10px_40px_-10px_rgba(63,184,78,0.35)] backdrop-blur transition-colors focus-within:border-brand-400 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2 px-3 py-2 text-left">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-5 w-5 shrink-0 text-brand-300"
                aria-hidden
              >
                <path
                  d="M12 3v3m0 12v3M3 12h3m12 0h3M5.64 5.64l2.12 2.12m8.48 8.48l2.12 2.12M5.64 18.36l2.12-2.12m8.48-8.48l2.12-2.12"
                  strokeLinecap="round"
                />
              </svg>
              <input
                id="hero-prompt"
                type="text"
                placeholder={`I want to build ${shown || typewriterPhrases[0]}`}
                className="w-full bg-transparent text-base text-white placeholder:text-night-300 focus:outline-none"
              />
              <span
                aria-hidden
                className="ml-1 hidden h-5 w-[2px] bg-brand-300 animate-blink-caret sm:inline-block"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-block border-3 border-brand-300 bg-brand-400 px-5 py-3 text-sm font-semibold text-night-900 shadow-[0_3px_0_0_rgba(0,0,0,0.45)] transition-transform hover:bg-brand-300 active:translate-y-[2px] sm:text-base"
            >
              Start building
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
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-night-300 animate-fade-up">
          <span className="text-2xs uppercase tracking-[0.22em] text-night-400">
            Not sure where to start? Try:
          </span>
          {suggestions.map((s) => (
            <Link
              key={s}
              href="/signup"
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-night-100 transition-colors hover:border-brand-400/50 hover:bg-brand-400/10 hover:text-white"
            >
              {s}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
