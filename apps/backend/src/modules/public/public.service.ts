import type { Prisma } from '@prisma/client';
import type { ListRecordsQuery } from '@ai-gen/shared';
import { prisma } from '../../db/prisma.js';
import { HttpError } from '../../utils/http-error.js';
import { appService } from '../apps/app.service.js';

/**
 * Public read-only API service.
 *
 * Security posture:
 *   - Every method takes `(ownerId, slug)` and goes through
 *     `appService.getPublicActiveConfig` which 404s unless `isPublic=true`.
 *   - No mutations are exposed here.
 *   - No per-owner existence probe: private/nonexistent apps are
 *     indistinguishable from the caller's POV.
 */

function parseSort(sort: string | undefined): Prisma.RecordOrderByWithRelationInput {
  if (!sort) return { createdAt: 'desc' };
  const [field, dir] = sort.split(':');
  const direction = dir === 'asc' ? 'asc' : 'desc';
  if (field === 'createdAt' || field === 'updatedAt') {
    return { [field]: direction } as Prisma.RecordOrderByWithRelationInput;
  }
  return { createdAt: 'desc' };
}

export const publicService = {
  async listRecords(
    ownerId: string,
    slug: string,
    entityKey: string,
    query: ListRecordsQuery,
  ): Promise<{
    items: Array<{
      id: string;
      data: unknown;
      createdAt: string;
      updatedAt: string;
    }>;
    page: number;
    pageSize: number;
    total: number;
  }> {
    const { app, config } = await appService.getPublicActiveConfig(ownerId, slug);

    const entity = config.entities.find((e) => e.key === entityKey);
    if (!entity) throw HttpError.notFound(`Entity "${entityKey}" not found`);

    const entityRow = await prisma.entity.findUnique({
      where: { appId_key: { appId: app.id, key: entity.key } },
      select: { id: true },
    });
    if (!entityRow) throw HttpError.notFound(`Entity "${entityKey}" not provisioned`);

    const where: Prisma.RecordWhereInput = {
      entityId: entityRow.id,
      appId: app.id,
      isDeleted: false,
    };

    // Free-text search across string-ish fields.
    if (query.q) {
      where.OR = entity.fields
        .filter((f) => ['string', 'text', 'email', 'url'].includes(f.type))
        .map((f) => ({
          data: {
            path: [f.key],
            string_contains: query.q!,
          } as Prisma.JsonFilter,
        }));
    }

    const [total, rows] = await prisma.$transaction([
      prisma.record.count({ where }),
      prisma.record.findMany({
        where,
        orderBy: parseSort(query.sort),
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return {
      items: rows.map((r) => ({
        id: r.id,
        data: r.data,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  },
};
