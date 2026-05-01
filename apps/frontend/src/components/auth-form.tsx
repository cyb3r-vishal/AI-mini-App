'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import {
  Button,
  Card,
  CardBody,
  Form,
  FormField,
  Input,
} from '@/components/ui';

export interface AuthFormValues {
  email: string;
  password: string;
  name?: string;
}

interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (values: AuthFormValues) => Promise<void>;
}

/**
 * Auth form used by /login and /signup.
 * Mobile-first layout inside a BlockKit card.
 */
export function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        email,
        password,
        name: mode === 'register' ? name || undefined : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = mode === 'login' ? 'Welcome back' : 'Create your account';
  const cta = mode === 'login' ? 'Sign in' : 'Sign up';
  const altHref = mode === 'login' ? '/signup' : '/login';
  const altLabel =
    mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in';

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardBody className="flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <p className="text-2xs font-semibold uppercase tracking-[0.2em] text-paper-500">
            AI App Generator
          </p>
          <h1 className="font-display text-xl text-paper-900 sm:text-2xl">{title}</h1>
        </header>

        <Form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <FormField label="Name">
              <Input
                type="text"
                value={name}
                autoComplete="name"
                placeholder="Jane Doe"
                onChange={(e) => setName(e.target.value)}
              />
            </FormField>
          )}
          <FormField label="Email" required hint="We won't send spam.">
            <Input
              type="email"
              value={email}
              autoComplete="email"
              required
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>
          <FormField label="Password" required>
            <Input
              type="password"
              value={password}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={mode === 'register' ? 8 : undefined}
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormField>

          {error && (
            <div
              role="alert"
              className="rounded-block border-3 border-ember-300 bg-ember-50 px-3 py-2 text-sm text-ember-600"
            >
              {error}
            </div>
          )}

          <Button type="submit" loading={isSubmitting} block>
            {cta}
          </Button>
        </Form>

        <p className="pt-2 text-center text-sm text-paper-600">
          <Link href={altHref} className="font-medium text-paper-900 hover:underline">
            {altLabel}
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
