import crypto from 'node:crypto';
import jwt, { type SignOptions, type JwtPayload } from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { HttpError } from '../../utils/http-error.js';

export interface AccessTokenPayload extends JwtPayload {
  sub: string; // user id
  email: string;
  role: 'ADMIN' | 'USER';
  typ: 'access';
}

export interface RefreshTokenPayload extends JwtPayload {
  sub: string; // user id
  sid: string; // session id
  typ: 'refresh';
}

const ISSUER = 'ai-gen';
const AUDIENCE = 'ai-gen-client';

const accessOpts: SignOptions = {
  issuer: ISSUER,
  audience: AUDIENCE,
  expiresIn: env.JWT_ACCESS_TTL as SignOptions['expiresIn'],
};

const refreshOpts: SignOptions = {
  issuer: ISSUER,
  audience: AUDIENCE,
  expiresIn: env.JWT_REFRESH_TTL as SignOptions['expiresIn'],
};

export const tokenService = {
  signAccess(payload: Omit<AccessTokenPayload, 'typ' | 'iat' | 'exp'>): string {
    return jwt.sign({ ...payload, typ: 'access' }, env.JWT_ACCESS_SECRET, accessOpts);
  },

  signRefresh(payload: Omit<RefreshTokenPayload, 'typ' | 'iat' | 'exp'>): string {
    return jwt.sign({ ...payload, typ: 'refresh' }, env.JWT_REFRESH_SECRET, refreshOpts);
  },

  verifyAccess(token: string): AccessTokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
        issuer: ISSUER,
        audience: AUDIENCE,
      }) as AccessTokenPayload;
      if (decoded.typ !== 'access') throw new Error('wrong token type');
      return decoded;
    } catch {
      throw HttpError.unauthorized('Invalid or expired access token');
    }
  },

  verifyRefresh(token: string): RefreshTokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
        issuer: ISSUER,
        audience: AUDIENCE,
      }) as RefreshTokenPayload;
      if (decoded.typ !== 'refresh') throw new Error('wrong token type');
      return decoded;
    } catch {
      throw HttpError.unauthorized('Invalid or expired refresh token');
    }
  },

  /** SHA-256 hash of a refresh token — what we store in the DB. */
  hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  },

  /**
   * Compute expiry date from a jsonwebtoken-style TTL string.
   * Supports `15m`, `30d`, `1h`, plain seconds, etc.
   */
  computeExpiry(ttl: string): Date {
    const seconds = parseTtlToSeconds(ttl);
    return new Date(Date.now() + seconds * 1000);
  },
};

function parseTtlToSeconds(ttl: string): number {
  const m = /^(\d+)\s*([smhd])?$/.exec(ttl.trim());
  if (!m) {
    const n = Number(ttl);
    if (Number.isFinite(n)) return n;
    throw new Error(`Invalid TTL: ${ttl}`);
  }
  const value = Number(m[1]);
  const unit = m[2] ?? 's';
  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      return value;
  }
}
