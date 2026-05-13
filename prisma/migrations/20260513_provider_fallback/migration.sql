-- Create provider configs table for ordered fallback chain
CREATE TABLE IF NOT EXISTS "provider_configs" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "base_url" TEXT NOT NULL,
  "api_key" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "provider_configs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "provider_configs_enabled_sort_order_idx"
  ON "provider_configs" ("enabled", "sort_order");

-- Backfill existing single-provider setup into provider_configs
INSERT INTO "provider_configs" (
  "id",
  "name",
  "base_url",
  "api_key",
  "model",
  "enabled",
  "is_primary",
  "sort_order",
  "created_at",
  "updated_at"
)
SELECT
  concat('prov_', substr(md5("id"), 1, 20)) AS "id",
  concat("site_name", ' Primary') AS "name",
  "provider_base_url" AS "base_url",
  "provider_api_key" AS "api_key",
  "provider_model" AS "model",
  true AS "enabled",
  true AS "is_primary",
  0 AS "sort_order",
  "created_at" AS "created_at",
  "updated_at" AS "updated_at"
FROM "app_settings"
WHERE "setup_completed" = true
  AND NOT EXISTS (SELECT 1 FROM "provider_configs");
