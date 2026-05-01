import type { Request, RequestHandler } from 'express';
import { tokenService, type AccessTokenPayload } from '../modules/auth/token.service.js';
import { HttpError } from '../utils/http-error.js';

export interface AuthContext {
  userId: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

// `Express.Request.auth` is augmented ambiently in `../types/express.d.ts`.

function extractBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token.trim();
}

/**
 * Express middleware that enforces a valid access token.
 * Populates `req.auth` on success; throws 401 otherwise.
 */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = extractBearer(req);
  if (!token) return next(HttpError.unauthorized('Missing access token'));

  const payload: AccessTokenPayload = tokenService.verifyAccess(token);
  req.auth = {
    userId: payload.sub,
    email: payload.email,
    role: payload.role,
  };
  next();
};

/**
 * Role guard factory — use after `requireAuth`.
 */
export const requireRole =
  (...roles: Array<'ADMIN' | 'USER'>): RequestHandler =>
  (req, _res, next) => {
    if (!req.auth) return next(HttpError.unauthorized());
    if (!roles.includes(req.auth.role)) return next(HttpError.forbidden());
    next();
  };
