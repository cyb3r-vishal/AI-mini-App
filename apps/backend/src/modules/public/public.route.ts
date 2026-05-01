import { Router } from 'express';
import { ListRecordsQuerySchema } from '@ai-gen/shared';
import { validateQuery } from '../../middleware/validate.js';
import { publicController } from './public.controller.js';

/**
 * Public, unauthenticated read-only routes.
 *
 *   GET /public/apps/:ownerId/:slug               → app metadata
 *   GET /public/apps/:ownerId/:slug/config        → active AppConfig
 *   GET /public/apps/:ownerId/:slug/entities/:entity/records?page=&pageSize=&q=&sort=
 *
 * Every handler 404s unless `App.isPublic=true`. No mutations supported.
 */
export const publicRouter: import('express').Router = Router();

publicRouter.get('/apps/:ownerId/:slug', publicController.getApp);
publicRouter.get('/apps/:ownerId/:slug/config', publicController.getConfig);
publicRouter.get(
  '/apps/:ownerId/:slug/entities/:entity/records',
  validateQuery(ListRecordsQuerySchema),
  publicController.listRecords,
);
