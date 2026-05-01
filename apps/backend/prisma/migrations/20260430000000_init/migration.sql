-- =============================================================================
-- Initial migration — AI App Generator
-- =============================================================================

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "AppStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- -----------------------------------------------------------------------------
-- users
-- -----------------------------------------------------------------------------
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- -----------------------------------------------------------------------------
-- sessions
-- -----------------------------------------------------------------------------
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");
CREATE INDEX "sessions_token_hash_idx" ON "sessions"("token_hash");

ALTER TABLE "sessions"
    ADD CONSTRAINT "sessions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- -----------------------------------------------------------------------------
-- apps (tenant: owner_id)
-- -----------------------------------------------------------------------------
CREATE TABLE "apps" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "AppStatus" NOT NULL DEFAULT 'DRAFT',
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),

    CONSTRAINT "apps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "apps_owner_id_slug_key" ON "apps"("owner_id", "slug");
CREATE INDEX "apps_owner_id_idx" ON "apps"("owner_id");
CREATE INDEX "apps_status_idx" ON "apps"("status");
CREATE INDEX "apps_owner_id_status_idx" ON "apps"("owner_id", "status");
CREATE INDEX "apps_updated_at_idx" ON "apps"("updated_at");

ALTER TABLE "apps"
    ADD CONSTRAINT "apps_owner_id_fkey"
    FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- -----------------------------------------------------------------------------
-- app_configs (versioned JSONB config)
-- -----------------------------------------------------------------------------
CREATE TABLE "app_configs" (
    "id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "config" JSONB NOT NULL,
    "checksum" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "app_configs_app_id_version_key" ON "app_configs"("app_id", "version");
CREATE INDEX "app_configs_app_id_idx" ON "app_configs"("app_id");
CREATE INDEX "app_configs_app_id_is_active_idx" ON "app_configs"("app_id", "is_active");
CREATE INDEX "app_configs_created_at_idx" ON "app_configs"("created_at");

-- Only one active config per app (enforced via partial unique index).
CREATE UNIQUE INDEX "app_configs_app_id_active_unique"
    ON "app_configs"("app_id")
    WHERE "is_active" = true;

-- GIN index for JSONB containment queries on config payload.
CREATE INDEX "app_configs_config_gin_idx"
    ON "app_configs" USING GIN ("config" jsonb_path_ops);

ALTER TABLE "app_configs"
    ADD CONSTRAINT "app_configs_app_id_fkey"
    FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- -----------------------------------------------------------------------------
-- entities (per-app schema metadata)
-- -----------------------------------------------------------------------------
CREATE TABLE "entities" (
    "id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "schema" JSONB NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "entities_app_id_key_key" ON "entities"("app_id", "key");
CREATE INDEX "entities_app_id_idx" ON "entities"("app_id");

-- GIN on schema for introspection queries.
CREATE INDEX "entities_schema_gin_idx"
    ON "entities" USING GIN ("schema" jsonb_path_ops);

ALTER TABLE "entities"
    ADD CONSTRAINT "entities_app_id_fkey"
    FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- -----------------------------------------------------------------------------
-- records (dynamic JSONB rows — high-volume table)
-- -----------------------------------------------------------------------------
CREATE TABLE "records" (
    "id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "records_entity_id_idx" ON "records"("entity_id");
CREATE INDEX "records_app_id_idx" ON "records"("app_id");
CREATE INDEX "records_owner_id_idx" ON "records"("owner_id");
CREATE INDEX "records_entity_id_is_deleted_idx" ON "records"("entity_id", "is_deleted");
CREATE INDEX "records_entity_id_created_at_idx" ON "records"("entity_id", "created_at");
CREATE INDEX "records_entity_id_updated_at_idx" ON "records"("entity_id", "updated_at");

-- Primary GIN index: fast `data @> '{"field":"value"}'` containment queries.
CREATE INDEX "records_data_gin_idx"
    ON "records" USING GIN ("data" jsonb_path_ops);

-- Partial index to keep live-row queries small when soft-deletes accumulate.
CREATE INDEX "records_entity_live_idx"
    ON "records"("entity_id", "updated_at" DESC)
    WHERE "is_deleted" = false;

ALTER TABLE "records"
    ADD CONSTRAINT "records_entity_id_fkey"
    FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
