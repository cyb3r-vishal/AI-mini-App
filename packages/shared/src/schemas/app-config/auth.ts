import { z } from 'zod';

/**
 * Authentication settings embedded in an AppConfig.
 * NOTE: These are per-app runtime behaviors, separate from the platform's own auth.
 */
export const AuthProviderSchema = z.enum(['email', 'google', 'github']).catch('email');

export const AuthSettingsSchema = z
  .object({
    enabled: z.boolean().default(true),
    allowSignup: z.boolean().default(true),
    requireEmailVerification: z.boolean().default(false),
    providers: z.array(AuthProviderSchema).default(['email']),
    sessionDurationMinutes: z.coerce.number().int().positive().max(43_200).default(60 * 24),
  })
  .default({})
  // If providers ends up empty after coercion, fall back to ['email'].
  .transform((v) => ({
    ...v,
    providers: v.providers.length > 0 ? v.providers : (['email'] as const),
  }));

export type AuthSettings = z.infer<typeof AuthSettingsSchema>;
export type AuthProvider = z.infer<typeof AuthProviderSchema>;
