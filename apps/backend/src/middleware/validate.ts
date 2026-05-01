import type { RequestHandler } from 'express';
import type { ZodTypeAny, z } from 'zod';
import { HttpError } from '../utils/http-error.js';

/** Validates `req.body` against a Zod schema, replacing it with the parsed value. */
export const validateBody =
  <S extends ZodTypeAny>(schema: S): RequestHandler<unknown, unknown, z.infer<S>> =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(
        HttpError.badRequest('Validation failed', result.error.flatten().fieldErrors),
      );
    }
    req.body = result.data;
    next();
  };

/** Validates `req.query` against a Zod schema. Parsed value stored on req.validatedQuery. */
export const validateQuery =
  <S extends ZodTypeAny>(schema: S): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(
        HttpError.badRequest('Invalid query parameters', result.error.flatten().fieldErrors),
      );
    }
    (req as unknown as { validatedQuery: z.infer<S> }).validatedQuery = result.data;
    next();
  };

// `Express.Request.validatedQuery` is augmented ambiently in `../types/express.d.ts`.
