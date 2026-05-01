'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';

const faqs = [
  {
    q: 'What is the AI App Generator?',
    a: 'A config-driven runtime that turns a JSON (or natural-language prompt) into a complete app — UI, database, auth, and APIs — without writing code per app.',
  },
  {
    q: 'Do I need coding experience?',
    a: 'No. Describe what you want and the platform scaffolds the app. Developers can extend it by registering new field, cell, widget and page types.',
  },
  {
    q: 'What kind of apps can I build?',
    a: 'CRMs, inventory trackers, onboarding portals, dashboards, planners, internal tools, customer portals — anything backed by forms, tables and dashboards.',
  },
  {
    q: 'How is data stored?',
    a: 'PostgreSQL with JSONB payloads and GIN indexes. Schemas are reconciled when your config changes, so records survive version upgrades.',
  },
  {
    q: 'How does authentication work?',
    a: 'Email + password with JWT access tokens and httpOnly refresh cookies, DB-backed sessions, bcrypt hashing, and role-scoped record access.',
  },
  {
    q: 'What happens if my config has errors?',
    a: 'The normalizer drops invalid entities/fields/pages with a structured issue list — it never throws. Unknown component types fall back to safe placeholders.',
  },
  {
    q: 'Can I import existing data?',
    a: 'Yes. Upload a CSV, preview the suggested column mapping, and commit. Rows are validated against the entity schema, with an optional skip-invalid mode.',
  },
  {
    q: 'Is it open and self-hostable?',
    a: 'Yes — the whole stack ships as a pnpm monorepo with Dockerfiles and a docker-compose.yml. Deploy it anywhere.',
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative border-b border-white/10 bg-night-950 text-white">
      <div className="mx-auto w-full max-w-4xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="mb-10 flex flex-col items-start gap-3 sm:items-center sm:text-center">
          <span className="text-2xs font-semibold uppercase tracking-[0.22em] text-brand-300">
            FAQ
          </span>
          <h2 className="max-w-2xl font-display text-3xl leading-tight tracking-tight text-white sm:text-5xl">
            Frequently asked questions
          </h2>
        </div>

        <ul className="flex flex-col gap-3">
          {faqs.map((item, idx) => {
            const isOpen = open === idx;
            return (
              <li key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className={cn(
                    'flex w-full items-center justify-between gap-4 rounded-block-lg border-3 px-5 py-4 text-left transition-colors',
                    isOpen
                      ? 'border-brand-400 bg-white/[0.04]'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20',
                  )}
                >
                  <span className="font-display text-base text-white sm:text-lg">
                    {item.q}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    className={cn(
                      'h-5 w-5 shrink-0 text-night-200 transition-transform',
                      isOpen && 'rotate-45 text-brand-300',
                    )}
                    aria-hidden
                  >
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </button>
                <div
                  className={cn(
                    'grid overflow-hidden transition-[grid-template-rows] duration-300',
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                  )}
                >
                  <div className="min-h-0">
                    <p className="px-5 pt-3 text-sm leading-relaxed text-night-200">
                      {item.a}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
