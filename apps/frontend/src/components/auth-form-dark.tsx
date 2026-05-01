'use client';

import { useState, type FormEvent } from 'react';
import { cn } from '@/lib/cn';

export interface AuthFormValues {
  email: string;
  password: string;
  name?: string;
}

interface AuthFormDarkProps {
  mode: 'login' | 'register';
  onSubmit: (values: AuthFormValues) => Promise<void>;
  /** Called when the user clicks one of the social provider buttons. */
  onProviderSignIn?: (provider: 'google' | 'github') => void;
}

/**
 * Dark-themed auth form designed to sit inside `<AuthShell />`.
 *
 * - Inline email + password fields with the night-800 card palette.
 * - Inline error + field-level validation.
 * - Social sign-in buttons (wired via `onProviderSignIn`, which the
 *   `/login` and `/signup` pages can mock as transactional toasts
 *   for now — the backend hook-points already exist).
 */
export function AuthFormDark({ mode, onSubmit, onProviderSignIn }: AuthFormDarkProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [providerLoading, setProviderLoading] = useState<'google' | 'github' | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        email: email.trim(),
        password,
        name: mode === 'register' ? (name.trim() || undefined) : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProvider = async (provider: 'google' | 'github') => {
    if (!onProviderSignIn) return;
    setProviderLoading(provider);
    try {
      onProviderSignIn(provider);
    } finally {
      // Keep the spinner visible briefly so the user sees feedback
      // before the toast/message lands.
      setTimeout(() => setProviderLoading(null), 600);
    }
  };

  const cta = mode === 'login' ? 'Sign in' : 'Create account';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {/* --- Social providers --------------------------------------- */}
      <div className="grid gap-2 sm:grid-cols-2">
        <ProviderButton
          provider="google"
          loading={providerLoading === 'google'}
          onClick={() => handleProvider('google')}
        />
        <ProviderButton
          provider="github"
          loading={providerLoading === 'github'}
          onClick={() => handleProvider('github')}
        />
      </div>

      <div className="flex items-center gap-3 text-2xs uppercase tracking-[0.22em] text-night-400">
        <span className="h-px flex-1 bg-white/10" />
        or with email
        <span className="h-px flex-1 bg-white/10" />
      </div>

      {mode === 'register' && (
        <Field label="Name" htmlFor="auth-name">
          <input
            id="auth-name"
            type="text"
            value={name}
            autoComplete="name"
            placeholder="Jane Doe"
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </Field>
      )}

      <Field label="Email" htmlFor="auth-email" required>
        <input
          id="auth-email"
          type="email"
          value={email}
          autoComplete="email"
          required
          placeholder="you@example.com"
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field
        label="Password"
        htmlFor="auth-password"
        required
        trailing={
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="text-xs font-medium text-night-300 hover:text-white"
          >
            {showPw ? 'Hide' : 'Show'}
          </button>
        }
      >
        <input
          id="auth-password"
          type={showPw ? 'text' : 'password'}
          value={password}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          required
          minLength={mode === 'register' ? 8 : undefined}
          placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </Field>

      {error && (
        <div
          role="alert"
          className="rounded-block border-2 border-ember-400/60 bg-ember-500/10 px-3 py-2 text-sm text-ember-200"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 rounded-block border-3 border-brand-300 bg-brand-400 px-5 py-3',
          'text-sm font-semibold text-night-900 shadow-[0_3px_0_0_rgba(0,0,0,0.45)]',
          'transition-transform hover:bg-brand-300 active:translate-y-[2px] active:shadow-[0_1px_0_0_rgba(0,0,0,0.45)]',
          'disabled:cursor-not-allowed disabled:opacity-60 disabled:active:translate-y-0',
        )}
      >
        {isSubmitting && (
          <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
          </svg>
        )}
        {isSubmitting ? (mode === 'login' ? 'Signing in…' : 'Creating account…') : cta}
        {!isSubmitting && (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {mode === 'register' && (
        <p className="text-center text-xs text-night-400">
          Passwords are hashed with bcrypt on our server — we never see plaintext.
        </p>
      )}
    </form>
  );
}

/* ===== Bits ============================================================= */

const inputClass = cn(
  'w-full rounded-block border-3 border-white/15 bg-night-900/60 px-3.5 py-2.5',
  'text-sm text-white placeholder:text-night-400',
  'transition-colors focus:border-brand-400 focus:outline-none focus:ring-0',
  'hover:border-white/25',
);

function Field({
  label,
  htmlFor,
  required,
  trailing,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-night-200">
        <span>
          {label}
          {required && <span className="ml-0.5 text-brand-300">*</span>}
        </span>
        {trailing}
      </span>
      {children}
    </label>
  );
}

function ProviderButton({
  provider,
  loading,
  onClick,
}: {
  provider: 'google' | 'github';
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-block border-2 border-white/15 bg-white/[0.04] px-3 py-2.5',
        'text-sm font-medium text-white transition-colors',
        'hover:border-white/30 hover:bg-white/[0.08]',
        'disabled:cursor-not-allowed disabled:opacity-60',
      )}
    >
      {loading ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
        </svg>
      ) : provider === 'google' ? (
        <GoogleIcon />
      ) : (
        <GithubIcon />
      )}
      {provider === 'google' ? 'Google' : 'GitHub'}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18.91-.25 1.89-.38 2.86-.38.97 0 1.95.13 2.86.38 2.18-1.49 3.14-1.18 3.14-1.18.63 1.59.23 2.76.11 3.05.73.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.05.78 2.12v3.14c0 .31.21.67.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}
