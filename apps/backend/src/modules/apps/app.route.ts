import { Router } from 'express';
import {
  CreateAppInputSchema,
  ListRecordsQuerySchema,
  PublishAppConfigInputSchema,
  UpdateAppInputSchema,
} from '@ai-gen/shared';
import { requireAuth } from '../../middleware/require-auth.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { appController } from './app.controller.js';
import { recordController } from '../records/record.controller.js';
import { importRouter } from '../import/import.route.js';

export const appRouter: import('express').Router = Router();

// All routes require auth. User-scoping is enforced inside each service.
appRouter.use(requireAuth);

// -- Apps ---------------------------------------------------------------------
appRouter.post('/', validateBody(CreateAppInputSchema), appController.create);
appRouter.get('/', appController.list);
appRouter.get('/:id', appController.get);
appRouter.patch('/:id', validateBody(UpdateAppInputSchema), appController.update);
appRouter.delete('/:id', appController.remove);

// -- Config -------------------------------------------------------------------
appRouter.get('/:id/config', appController.getConfig);
appRouter.post(
  '/:id/config',
  validateBody(PublishAppConfigInputSchema),
  appController.publishConfig,
);

// -- Records (dynamic per-entity CRUD) ----------------------------------------
appRouter.post('/:id/entities/:entity/records', recordController.create);
appRouter.get(
  '/:id/entities/:entity/records',
  validateQuery(ListRecordsQuerySchema),
  recordController.list,
);
appRouter.get('/:id/entities/:entity/records/:recordId', recordController.get);
appRouter.put('/:id/entities/:entity/records/:recordId', recordController.update);
appRouter.delete('/:id/entities/:entity/records/:recordId', recordController.remove);

// -- CSV import ---------------------------------------------------------------
appRouter.use('/:id/entities/:entity/import', importRouter);
