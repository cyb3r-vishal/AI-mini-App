import type { Prisma, PrismaClient } from '@prisma/client';
import type { AppConfig } from '@ai-gen/shared';

type Tx = PrismaClient | Prisma.TransactionClient;

/**
 * Reconcile the Entity rows for an App with those declared in an AppConfig.
 *
 * Strategy:
 *  - upsert by (appId, key)   → new/updated entities persisted
 *  - delete entities that exist in the DB but are no longer in the config
 *
 * Records are intentionally preserved even when their entity's schema changes
 * — record payloads are JSONB, so existing rows continue to work. Cleanup of
 * orphaned record fields is the frontend editor's concern, not the engine's.
 */
export async function syncEntitiesFromConfig(
  tx: Tx,
  appId: string,
  config: AppConfig,
): Promise<void> {
  const desiredKeys = config.entities.map((e) => e.key);

  // 1. Upsert each entity declared in the config.
  for (const entity of config.entities) {
    await tx.entity.upsert({
      where: { appId_key: { appId, key: entity.key } },
      create: {
        appId,
        key: entity.key,
        name: entity.name,
        description: entity.description ?? null,
        schema: entity as unknown as Prisma.InputJsonValue,
      },
      update: {
        name: entity.name,
        description: entity.description ?? null,
        schema: entity as unknown as Prisma.InputJsonValue,
      },
    });
  }

  // 2. Drop entities that were removed from the config.
  //    `ON DELETE CASCADE` on records handles their cleanup.
  await tx.entity.deleteMany({
    where: {
      appId,
      key: { notIn: desiredKeys.length > 0 ? desiredKeys : ['__never__'] },
    },
  });
}
