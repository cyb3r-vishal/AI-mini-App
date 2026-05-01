import Link from 'next/link';

type App = {
  title: string;
  tag: string;
  blurb: string;
  gradient: string;
  preview: React.ReactNode;
};

const apps: App[] = [
  {
    title: 'Inventory Manager',
    tag: 'Operations',
    blurb: 'Track SKUs, stock levels and suppliers.',
    gradient: 'from-brand-500/30 via-brand-400/10 to-transparent',
    preview: <MiniTable rows={4} />,
  },
  {
    title: 'Finance Dashboard',
    tag: 'Analytics',
    blurb: 'Revenue forecasts and expense breakdowns.',
    gradient: 'from-sky-500/30 via-sky-400/10 to-transparent',
    preview: <MiniBars />,
  },
  {
    title: 'Treks Planner',
    tag: 'Consumer',
    blurb: 'Routes, activity stats, photo notes.',
    gradient: 'from-sun-300/30 via-sun-200/10 to-transparent',
    preview: <MiniMap />,
  },
  {
    title: 'Meal Planner',
    tag: 'Lifestyle',
    blurb: 'Calorie tracking, groceries, recipes.',
    gradient: 'from-brand-400/30 via-sun-300/10 to-transparent',
    preview: <MiniList />,
  },
  {
    title: 'Learning Hub',
    tag: 'Education',
    blurb: 'Courses, lessons, saved content.',
    gradient: 'from-sky-400/30 via-brand-400/10 to-transparent',
    preview: <MiniCards />,
  },
  {
    title: 'Streaming App',
    tag: 'Media',
    blurb: 'Continue-watching, recommendations.',
    gradient: 'from-ember-400/25 via-sky-400/10 to-transparent',
    preview: <MiniPoster />,
  },
];

export function Gallery() {
  return (
    <section
      id="gallery"
      className="relative border-b border-white/10 bg-night-950 text-white"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="mb-10 flex flex-col items-start gap-3 sm:items-center sm:text-center">
          <span className="text-2xs font-semibold uppercase tracking-[0.22em] text-brand-300">
            Showcase
          </span>
          <h2 className="max-w-2xl font-display text-3xl leading-tight tracking-tight text-white sm:text-5xl">
            Any app, any shape
          </h2>
          <p className="max-w-xl text-night-300">
            The same runtime powers every one of these. Just a different JSON.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((a) => (
            <article
              key={a.title}
              className="group relative overflow-hidden rounded-block-xl border-3 border-white/10 bg-night-800 transition-transform hover:-translate-y-1"
            >
              <div
                aria-hidden
                className={`absolute inset-0 bg-gradient-to-br ${a.gradient} opacity-80 transition-opacity group-hover:opacity-100`}
              />
              <div className="relative flex h-44 items-center justify-center border-b border-white/10 bg-night-900/60 p-4">
                {a.preview}
              </div>
              <div className="relative flex flex-col gap-2 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg text-white">{a.title}</h3>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-2xs uppercase tracking-[0.2em] text-night-200">
                    {a.tag}
                  </span>
                </div>
                <p className="text-sm text-night-300">{a.blurb}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-block border-3 border-brand-300 bg-brand-400 px-5 py-3 text-sm font-semibold text-night-900 shadow-[0_3px_0_0_rgba(0,0,0,0.45)] transition-transform hover:bg-brand-300 active:translate-y-[2px]"
          >
            Build yours — it's free
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
        </div>
      </div>
    </section>
  );
}

/* ------------------------- mini preview widgets -------------------------- */

function MiniTable({ rows = 3 }: { rows?: number }) {
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-2xs uppercase tracking-[0.2em] text-night-400">
        <span>Items</span>
        <span>Stock</span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {Array.from({ length: rows }).map((_, i) => (
          <li
            key={i}
            className="flex items-center justify-between rounded-block border border-white/10 bg-night-900/70 px-3 py-1.5 text-xs text-night-100"
          >
            <span>SKU-{1000 + i * 7}</span>
            <span className="font-mono text-brand-300">
              {[124, 56, 210, 38][i % 4]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MiniBars() {
  const heights = [32, 58, 46, 72, 54, 80, 62];
  return (
    <div className="flex h-full w-full items-end gap-1.5">
      {heights.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm bg-gradient-to-t from-sky-600/80 to-sky-200"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

function MiniMap() {
  return (
    <svg viewBox="0 0 160 90" className="h-full w-full">
      <defs>
        <linearGradient id="m" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgb(255 205 63 / 0.9)" />
          <stop offset="100%" stopColor="rgb(63 184 78 / 0.4)" />
        </linearGradient>
      </defs>
      <path
        d="M5 75 Q 30 30 60 45 T 120 25 T 155 55"
        stroke="url(#m)"
        strokeWidth="2"
        fill="none"
      />
      {[
        [5, 75],
        [60, 45],
        [120, 25],
        [155, 55],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="rgb(63 184 78)" />
      ))}
    </svg>
  );
}

function MiniList() {
  const items = ['Greek salad', 'Oatmeal', 'Chicken wrap', 'Smoothie'];
  return (
    <ul className="flex w-full flex-col gap-1.5">
      {items.map((t, i) => (
        <li
          key={t}
          className="flex items-center gap-2 rounded-block border border-white/10 bg-night-900/70 px-3 py-1.5 text-xs text-night-100"
        >
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              i % 2 ? 'bg-sun-300' : 'bg-brand-400'
            }`}
          />
          {t}
        </li>
      ))}
    </ul>
  );
}

function MiniCards() {
  return (
    <div className="grid w-full grid-cols-3 gap-1.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-12 rounded-block border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02]"
        />
      ))}
    </div>
  );
}

function MiniPoster() {
  return (
    <div className="flex w-full gap-1.5">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-24 flex-1 rounded-block border border-white/10"
          style={{
            background: `linear-gradient(160deg, rgba(242,89,58,${
              0.15 + i * 0.1
            }), rgba(34,136,242,0.15))`,
          }}
        />
      ))}
    </div>
  );
}
