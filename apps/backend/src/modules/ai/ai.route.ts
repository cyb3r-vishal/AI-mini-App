import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.js';
import { validateBody } from '../../middleware/validate.js';
import { aiController } from './ai.controller.js';
import { GenerateConfigInputSchema } from './ai.schema.js';

export const aiRouter: import('express').Router = Router();

// All AI routes require auth — we don't want unauthenticated prompt traffic
// burning quota on our key.
aiRouter.use(requireAuth);

aiRouter.post(
  '/generate-config',
  validateBody(GenerateConfigInputSchema),
  aiController.generateConfig,
);
