import { z } from 'zod';

/**
 * Type-safe public (client-visible) env.
 * Only NEXT_PUBLIC_* variables may appear here.
 */
const ClientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:4000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('AI App Generator'),
});

export const clientEnv = ClientEnvSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
});

export type ClientEnv = typeof clientEnv;
