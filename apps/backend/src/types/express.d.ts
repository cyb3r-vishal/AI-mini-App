/**
 * Ambient Express request augmentations.
 *
 * Uses the `declare global { namespace Express }` form recommended by
 * `@types/express`, which works regardless of how `express-serve-static-core`
 * is resolved in the module graph (important when `moduleResolution` is
 * `Bundler`).
 *
 * Any middleware that attaches data to `req` should add its shape here rather
 * than using a local `declare module` that may not find the host module.
 */

import type { AuthContext } from '../middleware/require-auth.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Populated by `requireAuth` middleware. */
      auth?: AuthContext;
      /** Populated by `validateQuery` middleware. */
      validatedQuery?: unknown;
    }
  }
}

export {};
