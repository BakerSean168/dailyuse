-- AI Provider Onboarding V2 short-lived credential/session state.
-- Credential payloads are encrypted with the same key-id-aware ProviderSecretVault
-- used by persisted provider configs. Sessions are identity-bound, expiring and
-- one-time consumable; raw API keys never appear in this table.

CREATE TABLE IF NOT EXISTS "ai_provider_onboarding_sessions" (
    "id" TEXT NOT NULL,
    "identity_id" TEXT NOT NULL,
    "catalog_id" TEXT NOT NULL,
    "base_url" TEXT NOT NULL,
    "target_provider_id" TEXT,
    "credential_encrypted" TEXT NOT NULL,
    "credential_status" TEXT NOT NULL,
    "discovery_status" TEXT NOT NULL,
    "models_json" TEXT NOT NULL DEFAULT '[]',
    "verified_model_ids" TEXT NOT NULL DEFAULT '[]',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_provider_onboarding_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_provider_onboarding_sessions_identity_id_expires_at_idx"
ON "ai_provider_onboarding_sessions"("identity_id", "expires_at");

CREATE INDEX IF NOT EXISTS "ai_provider_onboarding_sessions_identity_id_target_provider_id_expires_at_idx"
ON "ai_provider_onboarding_sessions"("identity_id", "target_provider_id", "expires_at");

CREATE INDEX IF NOT EXISTS "ai_provider_onboarding_sessions_expires_at_idx"
ON "ai_provider_onboarding_sessions"("expires_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ai_provider_onboarding_sessions_identity_id_fkey'
  ) THEN
    ALTER TABLE "ai_provider_onboarding_sessions"
    ADD CONSTRAINT "ai_provider_onboarding_sessions_identity_id_fkey"
    FOREIGN KEY ("identity_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
