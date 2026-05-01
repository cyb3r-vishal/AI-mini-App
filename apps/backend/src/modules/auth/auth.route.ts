import { Router } from 'express';
import { LoginInputSchema, RegisterInputSchema } from '@ai-gen/shared';
import { validateBody } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/require-auth.js';
import { authController } from './auth.controller.js';

export const authRouter: import('express').Router = Router();

authRouter.post('/register', validateBody(RegisterInputSchema), authController.register);
authRouter.post('/login', validateBody(LoginInputSchema), authController.login);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', requireAuth, authController.me);
