import Link from 'next/link';

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'Showcase', href: '/#gallery' },
      { label: 'FAQ', href: '/#faq' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Apps', href: '/apps' },
      { label: 'Registry', href: '/registry' },
      { label: 'Import', href: '/import' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Docs', href: '/#faq' },
      { label: 'Changelog', href: '/#faq' },
      { label: 'Status', href: '/#faq' },
      { label: 'Roadmap', href: '/#faq' },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="relative border-t border-white/10 bg-night-950 text-night-200">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_2fr]">
        <div className="flex flex-col gap-4">
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
            AI App Generator
          </Link>
          <p className="max-w-sm text-sm leading-relaxed text-night-300">
            Turn a single JSON config — or a natural-language prompt — into a
            fully running app: database, auth, dynamic UI, CSV import, and
            notifications, all ready to use.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-2xs font-semibold uppercase tracking-[0.22em] text-night-400">
                {col.title}
              </h4>
              <ul className="flex flex-col gap-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-night-200 transition-colors hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-3 px-4 py-6 text-xs text-night-400 sm:flex-row sm:items-center sm:px-6">
          <p>© {new Date().getFullYear()} AI App Generator. All rights reserved.</p>
          <p>Built with Next.js, Express, Prisma & PostgreSQL.</p>
        </div>
      </div>
    </footer>
  );
}
