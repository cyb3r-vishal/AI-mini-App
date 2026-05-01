import crypto from 'node:crypto';
import type { User } from '@prisma/client';
import type {
  AuthResponse,
  LoginInput,
  PublicUser,
  RegisterInput,
} from '@ai-gen/shared';
import { prisma } from '../../db/prisma.js';
import { env } from '../../config/env.js';
import { HttpError } from '../../utils/http-error.js';
import { passwordService } from './password.service.js';
import { tokenService } from './token.service.js';

export interface ClientMeta {
  userAgent?: string;
  ipAddress?: string;
}

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

async function issueTokens(user: User, meta: ClientMeta): Promise<AuthResponse> {
  // 1. Create session row first so we have a session id to embed in refresh token.
  //    We create it with a placeholder hash, then update with the real hash.
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: `pending:${crypto.randomUUID()}`,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt: tokenService.computeExpiry(env.JWT_REFRESH_TTL),
    },
  });

  const accessToken = tokenService.signAccess({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = tokenService.signRefresh({ sub: user.id, sid: session.id });

  await prisma.session.update({
    where: { id: session.id },
    data: { tokenHash: tokenService.hashRefreshToken(refreshToken) },
  });

  return {
    user: toPublicUser(user),
    tokens: {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: tokenService.computeExpiry(env.JWT_ACCESS_TTL).toISOString(),
    },
  };
}

export const authService = {
  async register(input: RegisterInput, meta: ClientMeta): Promise<AuthResponse> {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw HttpError.conflict('Email is already registered');

    const passwordHash = await passwordService.hash(input.password);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name ?? null,
      },
    });

    return issueTokens(user, meta);
  },

  async login(input: LoginInput, meta: ClientMeta): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    // Constant-ish time path: always run bcrypt.compare even when user is missing.
    const hash = user?.passwordHash ?? '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv';
    const ok = await passwordService.verify(input.password, hash);
    if (!user || !ok || !user.isActive) {
      throw HttpError.unauthorized('Invalid email or password');
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    return issueTokens(updated, meta);
  },

  async refresh(refreshToken: string, meta: ClientMeta): Promise<AuthResponse> {
    const payload = tokenService.verifyRefresh(refreshToken);
    const tokenHash = tokenService.hashRefreshToken(refreshToken);

    const session = await prisma.session.findUnique({ where: { id: payload.sid } });
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt < new Date() ||
      session.tokenHash !== tokenHash ||
      session.userId !== payload.sub
    ) {
      throw HttpError.unauthorized('Invalid refresh token');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw HttpError.unauthorized('User not found');

    // Rotate: revoke old session, issue new.
    await prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return issueTokens(user, meta);
  },

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    try {
      const payload = tokenService.verifyRefresh(refreshToken);
      await prisma.session.updateMany({
        where: { id: payload.sid, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      /* swallow — logout is best-effort */
    }
  },

  async getMe(userId: string): Promise<PublicUser> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw HttpError.unauthorized('User not found');
    return toPublicUser(user);
  },
};
