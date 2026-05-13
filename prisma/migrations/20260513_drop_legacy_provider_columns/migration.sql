-- Remove legacy single-provider columns after provider_configs migration
ALTER TABLE "app_settings"
  DROP COLUMN IF EXISTS "provider_base_url",
  DROP COLUMN IF EXISTS "provider_api_key",
  DROP COLUMN IF EXISTS "provider_model";
