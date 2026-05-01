/**
 * Access-token storage.
 *
 * Strategy:
 *  - **Access token** lives in memory (module-scope). Never touches localStorage
 *    (mitigates XSS token theft). Lost on tab refresh — we silently recover by
 *    calling POST /auth/refresh using the httpOnly refresh cookie the backend set.
 *  - **Refresh token** is an httpOnly, SameSite cookie set by the backend. JS can
 *    never read it. All refresh calls must use `credentials: 'include'`.
 */

let accessToken: string | null = null;
const listeners = new Set<(token: string | null) => void>();

export const tokenStorage = {
  get(): string | null {
    return accessToken;
  },
  set(token: string | null): void {
    accessToken = token;
    listeners.forEach((fn) => fn(token));
  },
  subscribe(fn: (token: string | null) => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
