import { Router } from 'express';
import express from 'express';
import { configController } from './config.controller.js';

export const configRouter: import('express').Router = Router();

// Raw body size limit is enforced by global express.json. No auth required for
// validate/normalize — they're pure functions.
configRouter.post('/normalize', express.json({ limit: '2mb' }), configController.normalize);
