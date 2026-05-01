'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';

type Feature = {
  title: string;
  body: string;
  mock: (props: { active: boolean }) => React.ReactNode;
};

const features: Feature[] = [
  {
    title: 'Create at the speed of thought',
    body:
      'Tell us your idea, and watch it become a working app — pages, user flows, and building blocks all in place.',
    mock: ChatMock,
  },
  {
    title: 'A backend that builds with you',
    body:
      'Logins, JWT auth, JSONB records, role-based permissions and relational schemas are generated behind the scenes.',
    mock: BackendMock,
  },
  {
    title: 'Ready to use, instantly',
    body:
      'Every app ships with CSV import, event-driven notifications, config versioning, and a PWA-ready shell.',
    mock: DashboardMock,
  },
  {
    title: 'One platform. Any config.',
    body:
      'Swap a single JSON blob and the runtime reshapes itself. Bad fields, unknown widgets, duplicate keys — it keeps going.',
    mock: ConfigMock,
  },
];

export function Features() {
  const [active, setActive] = useState(0);
  const f = features[active];

  return (
    <section
      id="features"
      className="relative border-b border-white/10 bg-night-900 text-white"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="mb-12 flex flex-col items-start gap-3 sm:items-center sm:text-center">
          <span className="text-2xs font-semibold uppercase tracking-[0.22em] text-brand-300">
            Consider yourself limitless
          </span>
          <h2 className="max-w-2xl font-display text-3xl leading-tight tracking-tight text-white sm:text-5xl">
            Everything you need, already wired up
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          {/* Tabs */}
          <ol className="flex flex-col gap-3">
            {features.map((feat, idx) => {
              const isActive = idx === active;
              return (
                <li key={feat.title}>
                  <button
                    type="button"
                    onClick={() => setActive(idx)}
                    className={cn(
                      'group w-full rounded-block-lg border-3 p-5 text-left transition-all',
                      isActive
                        ? 'border-brand-400 bg-white/[0.04] shadow-[0_0_0_1px_rgba(63,184,78,0.25),0_20px_40px_-20px_rgba(63,184,78,0.6)]'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]',
                    )}
                  >
                    <div className="mb-1 flex items-center gap-3">
                      <span
                        className={cn(
                          'inline-flex h-7 w-7 items-center justify-center rounded-block border-2 font-mono text-xs',
                          isActive
                            ? 'border-brand-300 bg-brand-500 text-night-900'
                            : 'border-white/15 bg-white/[0.03] text-night-200',
                        )}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <h3 className="font-display text-lg leading-tight text-white sm:text-xl">
                        {feat.title}
                      </h3>
                    </div>
                    <p className="pl-10 text-sm leading-relaxed text-night-300">
                      {feat.body}
                    </p>
                  </button>
                </li>
              );
            })}
          </ol>

          {/* Mock preview pane */}
          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-x-8 -top-4 h-6 rounded-t-block-lg bg-brand-500/20 blur-2xl"
            />
            <div className="relative overflow-hidden rounded-block-xl border-3 border-white/15 bg-night-800 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
              <div className="flex items-center gap-1.5 border-b border-white/10 bg-night-900 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-ember-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-sun-300/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-brand-400/80" />
                <span className="ml-3 font-mono text-xs text-night-300">
                  {f.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.preview
                </span>
              </div>
              <div className="min-h-[320px] p-5 sm:min-h-[380px] sm:p-8">
                {f.mock({ active: true })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===== Mock previews ===================================================== */

function ChatMock() {
  return (
    <div className="flex h-full flex-col gap-3 text-left">
      <div className="self-end rounded-block border border-white/10 bg-brand-500 px-4 py-2 text-sm text-night-900">
        Build me a meal planner with shopping lists
      </div>
      <div className="self-start max-w-[85%] rounded-block border border-white/10 bg-night-700/60 px-4 py-3 text-sm text-night-100">
        <span className="font-semibold text-white">Agent:</span> Creating entities{' '}
        <code className="rounded bg-white/5 px-1">Recipe</code>,{' '}
        <code className="rounded bg-white/5 px-1">Ingredient</code>,{' '}
        <code className="rounded bg-white/5 px-1">ShoppingList</code>…
      </div>
      <div className="self-start max-w-[85%] rounded-block border border-white/10 bg-night-700/60 px-4 py-3 text-sm text-night-100">
        <span className="font-semibold text-white">Agent:</span> Generating pages:
        Recipes · Planner · Shopping List. Wiring up auth 🔒
      </div>
      <div className="mt-auto flex items-center gap-2 rounded-block border border-white/15 bg-night-900 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-brand-400 animate-pulse" />
        <span className="text-xs text-night-300">App running at /apps/meal-planner</span>
      </div>
    </div>
  );
}

function BackendMock() {
  const rows = [
    { method: 'POST', path: '/auth/register', status: 201 },
    { method: 'POST', path: '/auth/login', status: 200 },
    { method: 'GET', path: '/apps/crm/entities/lead/records', status: 200 },
    { method: 'POST', path: '/apps/crm/entities/lead/records', status: 201 },
    { method: 'PATCH', path: '/apps/crm/entities/lead/records/:id', status: 200 },
  ];
  const colors: Record<string, string> = {
    GET: 'text-sky-300 border-sky-400/40 bg-sky-400/10',
    POST: 'text-brand-200 border-brand-400/40 bg-brand-400/10',
    PATCH: 'text-sun-200 border-sun-300/40 bg-sun-300/10',
    DELETE: 'text-ember-200 border-ember-400/40 bg-ember-400/10',
  };
  return (
    <ul className="flex flex-col gap-2 font-mono text-xs text-night-200">
      {rows.map((r) => (
        <li
          key={r.path}
          className="flex items-center gap-3 rounded-block border border-white/10 bg-night-900/60 px-3 py-2"
        >
          <span
            className={cn(
              'inline-flex min-w-[54px] justify-center rounded border px-2 py-0.5 text-[0.65rem] font-semibold uppercase',
              colors[r.method],
            )}
          >
            {r.method}
          </span>
          <span className="flex-1 truncate text-night-100">{r.path}</span>
          <span className="text-brand-300">{r.status}</span>
        </li>
      ))}
    </ul>
  );
}

function DashboardMock() {
  const stats = [
    { label: 'Apps', value: '12', trend: '+3' },
    { label: 'Records', value: '4.2k', trend: '+218' },
    { label: 'Imports', value: '28', trend: '+4' },
  ];
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-block border border-white/10 bg-night-900/60 p-3"
          >
            <p className="text-2xs uppercase tracking-[0.2em] text-night-400">
              {s.label}
            </p>
            <p className="mt-1 font-display text-xl text-white">{s.value}</p>
            <p className="text-xs text-brand-300">{s.trend} this week</p>
          </div>
        ))}
      </div>
      <div className="flex-1 rounded-block border border-white/10 bg-night-900/60 p-4">
        <p className="mb-3 text-2xs uppercase tracking-[0.2em] text-night-400">
          Activity
        </p>
        <div className="flex h-28 items-end gap-1.5">
          {[22, 35, 28, 52, 40, 68, 48, 74, 60, 82, 70, 95].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-gradient-to-t from-brand-600/80 to-brand-300"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ConfigMock() {
  const code = `{
  "id": "crm",
  "name": "Tiny CRM",
  "entities": [
    {
      "key": "lead",
      "fields": [
        { "key": "name",  "type": "text",   "required": true },
        { "key": "email", "type": "email" },
        { "key": "stage", "type": "select",
          "options": ["new","qualified","won","lost"] }
      ]
    }
  ],
  "pages": [
    { "type": "table", "entity": "lead" },
    { "type": "form",  "entity": "lead" }
  ]
}`;
  return (
    <pre className="h-full overflow-auto rounded-block border border-white/10 bg-night-900/70 p-4 font-mono text-xs leading-relaxed text-night-100">
      <code>{code}</code>
    </pre>
  );
}
