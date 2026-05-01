'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { AuthFormDark } from '@/components/auth-form-dark';
import { AuthShell } from '@/components/marketing';
import { useAuth } from '@/lib/auth-context';

function LoginPageInner() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const redirectTo = search?.get('redirect') ?? '/dashboard';

  const [providerToast, setProviderToast] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace(redirectTo);
  }, [isLoading, isAuthenticated, router, redirectTo]);

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to your account"
      subtitle="Resume building. Your apps, data, and configs are exactly where you left them."
      footer={
        <>
          New here?{' '}
          <Link
            href="/signup"
            className="font-semibold text-brand-300 hover:text-brand-200 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      {providerToast && (
        <div
          role="status"
          className="rounded-block border-2 border-sky-400/40 bg-sky-500/10 px-3 py-2 text-xs text-sky-200"
        >
          {providerToast}
        </div>
      )}

      <AuthFormDark
        mode="login"
        onSubmit={async ({ email, password }) => {
          await login({ email, password });
          router.replace(redirectTo);
        }}
        onProviderSignIn={(provider) => {
          setProviderToast(
            `${provider === 'google' ? 'Google' : 'GitHub'} sign-in isn't wired to a provider yet — use email + password for now. The auth module is pluggable.`,
          );
        }}
      />

      <p className="pt-1 text-center text-xs text-night-400">
        Forgot your password?{' '}
        <Link
          href="/signup"
          className="text-night-200 hover:text-white hover:underline"
        >
          Reset it
        </Link>
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-night-900" />}>
      <LoginPageInner />
    </Suspense>
  );
}
