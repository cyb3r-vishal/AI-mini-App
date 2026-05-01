import { Router } from 'express';
import multer from 'multer';
import { ImportCommitInputSchema } from '@ai-gen/shared';
import { requireAuth } from '../../middleware/require-auth.js';
import { validateBody } from '../../middleware/validate.js';
import { importController } from './import.controller.js';

export const importRouter: import('express').Router = Router({ mergeParams: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const ok =
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'text/plain' ||
      file.originalname.toLowerCase().endsWith('.csv');
    cb(null, ok);
  },
});

importRouter.use(requireAuth);

// POST /apps/:id/entities/:entity/import
importRouter.post('/', upload.single('file'), importController.preview);

// POST /apps/:id/entities/:entity/import/commit
importRouter.post(
  '/commit',
  validateBody(ImportCommitInputSchema),
  importController.commit,
);
