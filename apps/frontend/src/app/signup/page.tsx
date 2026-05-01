'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthFormDark } from '@/components/auth-form-dark';
import { AuthShell } from '@/components/marketing';
import { useAuth } from '@/lib/auth-context';

export default function SignupPage() {
  const { register, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [providerToast, setProviderToast] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace('/dashboard');
  }, [isLoading, isAuthenticated, router]);

  return (
    <AuthShell
      eyebrow="Get started — free"
      title="Create your account"
      subtitle="No credit card. Ship your first config-driven app in minutes."
      footer={
        <>
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-brand-300 hover:text-brand-200 hover:underline"
          >
            Sign in
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
        mode="register"
        onSubmit={async ({ email, password, name }) => {
          await register({ email, password, name });
          router.replace('/dashboard');
        }}
        onProviderSignIn={(provider) => {
          setProviderToast(
            `${provider === 'google' ? 'Google' : 'GitHub'} sign-up isn't wired to a provider yet — use email + password for now. The auth module is pluggable.`,
          );
        }}
      />
    </AuthShell>
  );
}
