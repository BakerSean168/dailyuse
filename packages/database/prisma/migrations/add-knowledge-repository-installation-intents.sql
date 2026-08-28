-- Durable GitHub App installation orchestration.
-- Only a SHA-256 hash of the provider state is persisted. No raw OAuth state,
-- GitHub installation token, App private key, or other replayable credential is stored.

CREATE TABLE IF NOT EXISTS "knowledge_repository_installation_intents" (
    "id" TEXT NOT NULL,
    "identity_id" TEXT NOT NULL,
    "state_hash" TEXT NOT NULL,
    "route_key" TEXT NOT NULL,
    "client_kind" TEXT NOT NULL,
    "return_path" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "installation_id" TEXT,
    "provider_account_id" TEXT,
    "setup_action" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "callback_received_at" TIMESTAMP(3),
    "finalized_at" TIMESTAMP(3),
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_repository_installation_intents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "knowledge_repository_installation_intents_state_hash_key"
ON "knowledge_repository_installation_intents"("state_hash");

CREATE INDEX IF NOT EXISTS "knowledge_repository_installation_intents_identity_id_status_idx"
ON "knowledge_repository_installation_intents"("identity_id", "status");

CREATE INDEX IF NOT EXISTS "knowledge_repository_installation_intents_installation_id_status_idx"
ON "knowledge_repository_installation_intents"("installation_id", "status");

CREATE INDEX IF NOT EXISTS "knowledge_repository_installation_intents_expires_at_idx"
ON "knowledge_repository_installation_intents"("expires_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'knowledge_repository_installation_intents_identity_id_fkey'
  ) THEN
    ALTER TABLE "knowledge_repository_installation_intents"
    ADD CONSTRAINT "knowledge_repository_installation_intents_identity_id_fkey"
    FOREIGN KEY ("identity_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
