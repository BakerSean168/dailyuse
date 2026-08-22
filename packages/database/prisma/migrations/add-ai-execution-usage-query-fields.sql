-- AI vNext execution usage fields. The canonical deploy path reconciles the
-- Prisma schema via `prisma db push`; this idempotent SQL is retained only for
-- explicit/manual migration of databases managed outside that reconciliation.

ALTER TABLE "ai_generation_tasks"
  ADD COLUMN IF NOT EXISTS "conversation_id" TEXT,
  ADD COLUMN IF NOT EXISTS "run_id" TEXT,
  ADD COLUMN IF NOT EXISTS "request_id" TEXT,
  ADD COLUMN IF NOT EXISTS "trace_id" TEXT,
  ADD COLUMN IF NOT EXISTS "provider_id" TEXT,
  ADD COLUMN IF NOT EXISTS "model" TEXT,
  ADD COLUMN IF NOT EXISTS "estimated_cost_usd" DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS "ai_generation_tasks_identity_conversation_created_idx"
  ON "ai_generation_tasks"("identity_id", "conversation_id", "created_at");

CREATE INDEX IF NOT EXISTS "ai_generation_tasks_identity_run_created_idx"
  ON "ai_generation_tasks"("identity_id", "run_id", "created_at");
