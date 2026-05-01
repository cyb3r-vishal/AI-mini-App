import type {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from 'express';

/** Structural stand-in for Express's internal param shape.
 *  Avoids pulling in `express-serve-static-core` as a direct dep — we only
 *  need the constraint to line up at the `.get / .post / .use` call-site. */
export type ParamsDictionary = Record<string, string>;

/**
 * Wraps async route handlers so thrown errors reach the global error middleware.
 *
 * `P` is constrained to `ParamsDictionary` so concrete route param types like
 * `{ id: string }` satisfy Express's own `RequestHandler` when registered on a
 * Router.
 */
export const asyncHandler =
  <
    P extends ParamsDictionary = ParamsDictionary,
    ResBody = unknown,
    ReqBody = unknown,
    ReqQuery = unknown,
  >(
    fn: (
      req: Request<P, ResBody, ReqBody, ReqQuery>,
      res: Response<ResBody>,
      next: NextFunction,
    ) => Promise<unknown>,
  ): RequestHandler<P, ResBody, ReqBody, ReqQuery> =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
