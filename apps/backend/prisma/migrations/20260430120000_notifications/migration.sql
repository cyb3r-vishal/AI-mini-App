-- =============================================================================
-- Notifications
-- =============================================================================

CREATE TYPE "NotificationType" AS ENUM (
    'RECORD_CREATED',
    'RECORD_UPDATED',
    'RECORD_DELETED',
    'SYSTEM'
);

CREATE TABLE "notifications" (
    "id"         TEXT NOT NULL,
    "user_id"    TEXT NOT NULL,
    "type"       "NotificationType" NOT NULL,
    "title"      TEXT NOT NULL,
    "message"    TEXT,
    "meta"       JSONB NOT NULL,
    "read_at"    TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_user_id_idx"             ON "notifications"("user_id");
CREATE INDEX "notifications_user_id_read_at_idx"     ON "notifications"("user_id", "read_at");
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- Partial index to keep unread-count queries fast.
CREATE INDEX "notifications_user_unread_idx"
    ON "notifications"("user_id", "created_at" DESC)
    WHERE "read_at" IS NULL;

ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
