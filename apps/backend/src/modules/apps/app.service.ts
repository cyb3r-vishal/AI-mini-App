import crypto from 'node:crypto';
import type { App as PrismaApp, Prisma } from '@prisma/client';
import {
  AppConfigSchema,
  normalizeAppConfig,
  type AppConfig,
  type CreateAppInput,
  type NormalizeIssue,
  type PublicApp,
  type UpdateAppInput,
} from '@ai-gen/shared';
import { prisma } from '../../db/prisma.js';
import { HttpError } from '../../utils/http-error.js';
import { syncEntitiesFromConfig } from '../entities/entity-sync.service.js';

/** Prisma JSONB columns want `InputJsonValue`; our typed AppConfig is structurally
 * compatible but TS can't prove that through Zod's inferred record types. */
function toJsonInput(config: AppConfig): Prisma.InputJsonValue {
  return config as unknown as Prisma.InputJsonValue;
}

/**
 * App lifecycle + config activation.
 * Multi-tenant: every function is scoped by `ownerId`.
 */

function toPublicApp(app: PrismaApp, activeVersion: number | null): PublicApp {
  return {
    id: app.id,
    ownerId: app.ownerId,
    slug: app.slug,
    name: app.name,
    description: app.description,
    status: app.status,
    isPublic: app.isPublic,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
    activeConfigVersion: activeVersion,
  };
}

function canonicalChecksum(config: AppConfig): string {
  // Stable key order via JSON.stringify with sorted keys.
  const sortedKeys = (obj: unknown): unknown => {
    if (Array.isArray(obj)) return obj.map(sortedKeys);
    if (obj && typeof obj === 'object') {
      return Object.keys(obj as Record<string, unknown>)
        .sort()
        .reduce<Record<string, unknown>>((acc, k) => {
          acc[k] = sortedKeys((obj as Record<string, unknown>)[k]);
          return acc;
        }, {});
    }
    return obj;
  };
  return crypto.createHash('sha256').update(JSON.stringify(sortedKeys(config))).digest('hex');
}

function buildSkeletonConfig(slug: string, name: string): AppConfig {
  return AppConfigSchema.parse({
    id: slug,
    name,
  });
}

export const appService = {
  async create(ownerId: string, input: CreateAppInput): Promise<PublicApp> {
    const existing = await prisma.app.findUnique({
      where: { ownerId_slug: { ownerId, slug: input.slug } },
    });
    if (existing) throw HttpError.conflict(`Slug "${input.slug}" is already in use`);

    // Normalize any supplied config, else synthesize a skeleton.
    const { config } =
      input.config === undefined
        ? { config: buildSkeletonConfig(input.slug, input.name) }
        : normalizeAppConfig(input.config);

    const app = await prisma.$transaction(async (tx) => {
      const created = await tx.app.create({
        data: {
          ownerId,
          slug: input.slug,
          name: input.name,
          description: input.description,
        },
      });

      await tx.appConfig.create({
        data: {
          appId: created.id,
          version: 1,
          config: toJsonInput(config),
          checksum: canonicalChecksum(config),
          isActive: true,
          notes: 'Initial config',
        },
      });

      await syncEntitiesFromConfig(tx, created.id, config);
      return created;
    });

    return toPublicApp(app, 1);
  },

  async list(ownerId: string): Promise<PublicApp[]> {
    const apps = await prisma.app.findMany({
      where: { ownerId },
      orderBy: { updatedAt: 'desc' },
      include: {
        configs: {
          where: { isActive: true },
          select: { version: true },
          take: 1,
        },
      },
    });
    return apps.map((a) => toPublicApp(a, a.configs[0]?.version ?? null));
  },

  async getById(ownerId: string, appId: string): Promise<PublicApp> {
    const app = await prisma.app.findFirst({
      where: { id: appId, ownerId },
      include: {
        configs: { where: { isActive: true }, select: { version: true }, take: 1 },
      },
    });
    if (!app) throw HttpError.notFound('App not found');
    return toPublicApp(app, app.configs[0]?.version ?? null);
  },

  async update(ownerId: string, appId: string, input: UpdateAppInput): Promise<PublicApp> {
    const app = await prisma.app.findFirst({ where: { id: appId, ownerId } });
    if (!app) throw HttpError.notFound('App not found');

    const updated = await prisma.app.update({
      where: { id: app.id },
      data: {
        name: input.name,
        description: input.description,
        status: input.status,
        isPublic: input.isPublic,
        publishedAt: input.status === 'PUBLISHED' ? new Date() : undefined,
      },
      include: {
        configs: { where: { isActive: true }, select: { version: true }, take: 1 },
      },
    });
    return toPublicApp(updated, updated.configs[0]?.version ?? null);
  },

  async delete(ownerId: string, appId: string): Promise<void> {
    const app = await prisma.app.findFirst({ where: { id: appId, ownerId } });
    if (!app) throw HttpError.notFound('App not found');
    await prisma.app.delete({ where: { id: app.id } });
  },

  /**
   * Persist a new config version, activate it, and sync entities.
   * Returns the normalized config + any issues raised during normalization.
   */
  async publishConfig(
    ownerId: string,
    appId: string,
    rawConfig: unknown,
    notes?: string,
  ): Promise<{ version: number; config: AppConfig; issues: NormalizeIssue[] }> {
    const app = await prisma.app.findFirst({ where: { id: appId, ownerId } });
    if (!app) throw HttpError.notFound('App not found');

    const { config, issues } = normalizeAppConfig(rawConfig);

    const result = await prisma.$transaction(async (tx) => {
      const last = await tx.appConfig.findFirst({
        where: { appId: app.id },
        orderBy: { version: 'desc' },
        select: { version: true },
      });
      const nextVersion = (last?.version ?? 0) + 1;

      // Deactivate previous active.
      await tx.appConfig.updateMany({
        where: { appId: app.id, isActive: true },
        data: { isActive: false },
      });

      await tx.appConfig.create({
        data: {
          appId: app.id,
          version: nextVersion,
          config: toJsonInput(config),
          checksum: canonicalChecksum(config),
          isActive: true,
          notes,
        },
      });

      await syncEntitiesFromConfig(tx, app.id, config);
      return nextVersion;
    });

    return { version: result, config, issues };
  },

  /** Load the currently active config. Throws 404 if the app or its config is missing. */
  async getActiveConfig(
    ownerId: string,
    appId: string,
  ): Promise<{ app: PrismaApp; config: AppConfig }> {
    const app = await prisma.app.findFirst({ where: { id: appId, ownerId } });
    if (!app) throw HttpError.notFound('App not found');

    const active = await prisma.appConfig.findFirst({
      where: { appId: app.id, isActive: true },
      orderBy: { version: 'desc' },
    });
    if (!active) throw HttpError.notFound('App has no active config');

    // `active.config` is JSONB, re-run normalization for guaranteed runtime safety.
    const { config } = normalizeAppConfig(active.config);
    return { app, config };
  },

  /**
   * Public variant of `getActiveConfig` — no ownership check, but the app MUST
   * be marked `isPublic=true`. Returns 404 for any private or missing app
   * so we never leak existence to anonymous callers.
   */
  async getPublicActiveConfig(
    ownerId: string,
    slug: string,
  ): Promise<{ app: PrismaApp; config: AppConfig }> {
    const app = await prisma.app.findFirst({
      where: { ownerId, slug, isPublic: true },
    });
    if (!app) throw HttpError.notFound('App not found');

    const active = await prisma.appConfig.findFirst({
      where: { appId: app.id, isActive: true },
      orderBy: { version: 'desc' },
    });
    if (!active) throw HttpError.notFound('App has no active config');

    const { config } = normalizeAppConfig(active.config);
    return { app, config };
  },

  /** Public metadata — same existence rules as `getPublicActiveConfig`. */
  async getPublicApp(ownerId: string, slug: string): Promise<PublicApp> {
    const app = await prisma.app.findFirst({
      where: { ownerId, slug, isPublic: true },
      include: {
        configs: { where: { isActive: true }, select: { version: true }, take: 1 },
      },
    });
    if (!app) throw HttpError.notFound('App not found');
    return toPublicApp(app, app.configs[0]?.version ?? null);
  },
};
