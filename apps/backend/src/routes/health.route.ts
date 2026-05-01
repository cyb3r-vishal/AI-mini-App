import { Router } from 'express';

export const healthRouter: import('express').Router = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    ok: true,
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * Ultra-lightweight keep-alive endpoint.
 * Responds with a plain 200 and no body — cheap enough to be pinged
 * every few minutes by an external cron (GitHub Actions / UptimeRobot)
 * to prevent free-tier hosts (Render, Fly, Koyeb) from spinning down.
 */
healthRouter.get('/ping', (_req, res) => {
  res.status(200).type('text/plain').send('pong');
});

