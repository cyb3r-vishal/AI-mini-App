'use client';

import { useState } from 'react';
import type { Entity } from '@ai-gen/shared';
import { AppShell } from '@/components/app-shell';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui';
import { DynamicForm } from '@/components/dynamic-form';

/**
 * Dynamic form showcase.
 *
 * Uses a hand-crafted entity (so the demo runs without a backend/app).
 * In production, pass an entity loaded from `api.apps.getConfig(appId)`
 * and an `onSubmit` that calls `api.records.create(appId, entity.key, values)`.
 */
const customerEntity: Entity = {
  key: 'customer',
  name: 'Customer',
  timestamps: true,
  fields: [
    { type: 'string', key: 'name', label: 'Full name', required: true, minLength: 2, unique: false, indexed: false },
    { type: 'email', key: 'email', label: 'Email', required: true, unique: true, indexed: false },
    {
      type: 'select',
      key: 'status',
      label: 'Status',
      required: false,
      unique: false,
      indexed: false,
      options: [
        { value: 'lead', label: 'Lead' },
        { value: 'active', label: 'Active' },
        { value: 'archived', label: 'Archived' },
      ],
    },
    {
      type: 'multiselect',
      key: 'tags',
      label: 'Tags',
      required: false,
      unique: false,
      indexed: false,
      options: [
        { value: 'vip', label: 'VIP' },
        { value: 'newsletter', label: 'Newsletter' },
        { value: 'beta', label: 'Beta user' },
      ],
      defaultValue: [],
    },
    { type: 'number', key: 'value', label: 'Lifetime value', min: 0, required: false, unique: false, indexed: false },
    { type: 'date', key: 'joinedAt', label: 'Joined on', required: false, unique: false, indexed: false },
    { type: 'text', key: 'notes', label: 'Notes', required: false, unique: false, indexed: false, maxLength: 1000 },
  ],
};

export default function DynamicFormShowcase() {
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null);

  return (
    <AppShell>
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dynamic form</h1>
        <p className="mt-2 text-paper-600">
          The schema is read from the entity definition at runtime. Try submitting with
          an empty name, an invalid email, or an out-of-range number.
        </p>
      </header>

      <DynamicForm
        entity={customerEntity}
        layout="grid"
        title="New customer"
        submitLabel="Create customer"
        onSubmit={async (values) => {
          // Simulate latency + server-side error for a specific email.
          await new Promise((r) => setTimeout(r, 700));
          if (values.email === 'boom@example.com') {
            throw {
              status: 400,
              message: 'Validation failed',
              details: { email: ['This email is already registered.'] },
            };
          }
          return values;
        }}
        onSuccess={(values) => setSubmitted(values)}
      />

      {submitted && (
        <Card tone="brand">
          <CardHeader>
            <CardTitle>Last submission</CardTitle>
          </CardHeader>
          <CardBody>
            <pre className="overflow-x-auto text-xs text-paper-800">
              {JSON.stringify(submitted, null, 2)}
            </pre>
          </CardBody>
        </Card>
      )}
    </main>
    </AppShell>
  );
}
