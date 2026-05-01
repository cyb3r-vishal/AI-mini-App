'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NotificationBell } from '@/components/notification-bell';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/cn';

/**
 * <AppShell />
 *
 * Responsive chrome used by authenticated pages.
 *  - Desktop: sticky top header with inline nav.
 *  - Mobile:  sticky top header with hamburger → full-width dropdown menu.
 *  - Bell + sign-out always reachable.
 */

export interface NavItem {
  href: string;
  label: string;
}

const DEFAULT_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/apps', label: 'Apps' },
  { href: '/tables', label: 'Tables' },
  { href: '/forms', label: 'Forms' },
  { href: '/import', label: 'Import' },
  { href: '/notifications', label: 'Alerts' },
];

export interface AppShellProps {
  children: React.ReactNode;
  nav?: NavItem[];
  title?: React.ReactNode;
}

export function AppShell({ children, nav = DEFAULT_NAV, title }: AppShellProps) {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on route change.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="bk-dark-app bk-paper-bg flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b-3 border-paper-700 bg-paper-50/95 backdrop-blur supports-[backdrop-filter]:bg-paper-50/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          {/* Hamburger (mobile) */}
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-block border-3 border-paper-700 bg-white text-paper-800 shadow-block-sm md:hidden"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
              {menuOpen ? (
                <path
                  d="M4 4l12 12M16 4 4 16"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="square"
                  fill="none"
                />
              ) : (
                <path
                  d="M3 5h14M3 10h14M3 15h14"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="square"
                  fill="none"
                />
              )}
            </svg>
          </button>

          <Link
            href="/dashboard"
            className="min-w-0 truncate font-display text-sm text-paper-900 sm:text-base"
          >
            {title ?? 'AI App Generator'}
          </Link>

          {/* Desktop nav */}
          <nav className="ml-4 hidden md:flex md:items-center md:gap-1">
            {nav.map((item) => (
              <NavLink key={item.href} item={item} active={pathname === item.href} />
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {isAuthenticated && <NotificationBell />}
            {isAuthenticated ? (
              <Button
                size="sm"
                variant="outline"
                className="hidden sm:inline-flex"
                onClick={() => void logout()}
              >
                Sign out
              </Button>
            ) : (
              <Link href="/login">
                <Button size="sm">Sign in</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="border-t-3 border-paper-200 bg-white md:hidden">
            <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
              {nav.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={pathname === item.href}
                  mobile
                />
              ))}
              {isAuthenticated && (
                <>
                  <div className="my-2 border-t-3 border-paper-100" />
                  <p className="text-2xs uppercase tracking-wider text-paper-500">
                    Signed in as
                  </p>
                  <p className="truncate text-sm font-medium text-paper-800">
                    {user?.email}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-2 w-full"
                    onClick={() => void logout()}
                  >
                    Sign out
                  </Button>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      <div className="flex-1">{children}</div>
    </div>
  );
}

function NavLink({
  item,
  active,
  mobile,
}: {
  item: NavItem;
  active: boolean;
  mobile?: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        'rounded-block border-3 px-3 py-1.5 text-sm font-medium transition-colors',
        mobile ? 'block' : 'inline-block',
        active
          ? 'border-paper-700 bg-paper-900 text-white shadow-block-sm'
          : 'border-transparent text-paper-700 hover:bg-paper-100',
      )}
    >
      {item.label}
    </Link>
  );
}
