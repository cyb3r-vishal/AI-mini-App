import type { Request, Response } from 'express';
import type { LoginInput, RegisterInput } from '@ai-gen/shared';
import { env } from '../../config/env.js';
import { asyncHandler, type ParamsDictionary } from '../../utils/async-handler.js';
import { HttpError } from '../../utils/http-error.js';
import { authService, type ClientMeta } from './auth.service.js';
import { tokenService } from './token.service.js';

const REFRESH_COOKIE = 'refresh_token';

function clientMeta(req: {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
}): ClientMeta {
  const ua = req.headers['user-agent'];
  return {
    userAgent: Array.isArray(ua) ? ua[0] : ua,
    ipAddress: req.ip,
  };
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SECURE ? 'none' : 'lax',
    domain: env.COOKIE_DOMAIN,
    path: '/',
    expires: tokenService.computeExpiry(env.JWT_REFRESH_TTL),
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SECURE ? 'none' : 'lax',
    domain: env.COOKIE_DOMAIN,
    path: '/',
  });
}

export const authController = {
  register: asyncHandler<ParamsDictionary, unknown, RegisterInput>(async (req, res) => {
    const result = await authService.register(req.body, clientMeta(req));
    setRefreshCookie(res, result.tokens.refreshToken);
    res.status(201).json({ ok: true, data: result });
  }),

  login: asyncHandler<ParamsDictionary, unknown, LoginInput>(async (req, res) => {
    const result = await authService.login(req.body, clientMeta(req));
    setRefreshCookie(res, result.tokens.refreshToken);
    res.json({ ok: true, data: result });
  }),

  refresh: asyncHandler(async (req, res) => {
    const fromCookie = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
    const fromBody = (req.body as { refreshToken?: string } | undefined)?.refreshToken;
    const refreshToken = fromCookie ?? fromBody;
    if (!refreshToken) throw HttpError.unauthorized('Missing refresh token');

    const result = await authService.refresh(refreshToken, clientMeta(req));
    setRefreshCookie(res, result.tokens.refreshToken);
    res.json({ ok: true, data: result });
  }),

  logout: asyncHandler(async (req, res) => {
    const fromCookie = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
    const fromBody = (req.body as { refreshToken?: string } | undefined)?.refreshToken;
    await authService.logout(fromCookie ?? fromBody);
    clearRefreshCookie(res);
    res.json({ ok: true, data: { success: true } });
  }),

  me: asyncHandler(async (req, res) => {
    if (!req.auth) throw HttpError.unauthorized();
    const user = await authService.getMe(req.auth.userId);
    res.json({ ok: true, data: user });
  }),
};
