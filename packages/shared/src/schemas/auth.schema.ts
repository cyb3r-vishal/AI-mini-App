import { z } from 'zod';

/**
 * Auth contracts — shared between frontend and backend.
 */

export const EmailSchema = z.string().trim().toLowerCase().email();

export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long');

export const RegisterInputSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  name: z.string().trim().min(1).max(120).optional(),
});

export const LoginInputSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1),
});

export const PublicUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: z.enum(['ADMIN', 'USER']),
  createdAt: z.string(), // ISO
});

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  accessTokenExpiresAt: z.string(), // ISO
});

export const AuthResponseSchema = z.object({
  user: PublicUserSchema,
  tokens: AuthTokensSchema,
});

export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type PublicUser = z.infer<typeof PublicUserSchema>;
export type AuthTokens = z.infer<typeof AuthTokensSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
