import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.route.js';
import { authRouter } from './modules/auth/auth.route.js';
import { configRouter } from './modules/config/config.route.js';
import { appRouter } from './modules/apps/app.route.js';
import { aiRouter } from './modules/ai/ai.route.js';
import { publicRouter } from './modules/public/public.route.js';
import { notificationRouter } from './modules/notifications/notification.route.js';
import { registerNotificationHandlers } from './modules/notifications/notification.handlers.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';

/**
 * Builds and configures the Express application.
 */
export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1); // respect X-Forwarded-* behind a proxy

  app.use(helmet());

  // CORS: env.CORS_ORIGIN is a normalized array (see config/env.ts). Compare
  // the request's Origin against the allowlist with trailing slashes stripped
  // so a sloppy env value (`https://app.com/`) still works. Requests without
  // an Origin (curl, same-origin, server-to-server) are always allowed.
  const allowedOrigins = new Set(env.CORS_ORIGIN);
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        const normalized = origin.replace(/\/+$/, '');
        if (allowedOrigins.has(normalized)) return cb(null, true);
        return cb(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Wire event handlers once per process.
  registerNotificationHandlers();

  // Routes
  app.use('/health', healthRouter);
  app.use('/auth', authRouter);
  app.use('/config', configRouter);
  app.use('/apps', appRouter);
  app.use('/ai', aiRouter);
  app.use('/public', publicRouter);
  app.use('/notifications', notificationRouter);

  // 404 + error handlers last
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
