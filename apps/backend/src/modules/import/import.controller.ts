import type { ImportCommitInput } from '@ai-gen/shared';
import { asyncHandler } from '../../utils/async-handler.js';
import { HttpError } from '../../utils/http-error.js';
import { importService } from './import.service.js';

interface Params extends Record<string, string> {
  id: string; // app id
  entity: string; // entity key
}

export const importController = {
  preview: asyncHandler<Params>(async (req, res) => {
    if (!req.auth) throw HttpError.unauthorized();
    const file = (req as unknown as { file?: Express.Multer.File }).file;
    if (!file) throw HttpError.badRequest('CSV file is required (form field "file").');

    const preview = await importService.preview({
      ownerId: req.auth.userId,
      appId: req.params.id,
      entityKey: req.params.entity,
      buffer: file.buffer,
    });
    res.status(201).json({ ok: true, data: preview });
  }),

  commit: asyncHandler<Params, unknown, ImportCommitInput>(async (req, res) => {
    if (!req.auth) throw HttpError.unauthorized();
    const result = await importService.commit({
      ownerId: req.auth.userId,
      uploadId: req.body.uploadId,
      mapping: req.body.mapping,
      skipInvalid: req.body.skipInvalid,
    });
    res.json({ ok: true, data: result });
  }),
};
