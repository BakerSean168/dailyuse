-- ROUTINE-3401: durable occurrence fence for the routine wall-clock lane.
--
-- The default deploy path is Prisma schema reconciliation (`prisma db push`),
-- which propagates `routine_occurrences` from the shared schema automatically.
-- This DDL only helps an explicit/manual migration of a database that predates
-- the lane and is maintained outside Prisma's reconciliation (same convention
-- as add-account-closure-last-error-code.sql).
CREATE TABLE IF NOT EXISTS "routine_occurrences" (
  "id" TEXT NOT NULL,
  "identity_id" TEXT NOT NULL,
  "routine_id" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'routine',
  "occurrence_key" TEXT NOT NULL,
  "scheduled_for" TIMESTAMP(3) NOT NULL,
  "source_revision" TEXT,
  "idempotency_key" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "attempt" INTEGER NOT NULL DEFAULT 0,
  "owner_token" TEXT,
  "claim_id" TEXT,
  "fencing_token" INTEGER NOT NULL DEFAULT 0,
  "lease_expires_at" TIMESTAMP(3),
  "last_error" TEXT,
  "next_retry_at" TIMESTAMP(3),
  "dead_letter_at" TIMESTAMP(3),
  "correlation_id" TEXT,
  "causation_id" TEXT,
  "history_json" TEXT,
  "next_occurrence_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "finished_at" TIMESTAMP(3),

  CONSTRAINT "routine_occurrences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "routine_occurrences_idempotency_key_key"
  ON "routine_occurrences"("idempotency_key");

CREATE UNIQUE INDEX IF NOT EXISTS "routine_occurrences_identity_id_routine_id_occurrence_key_key"
  ON "routine_occurrences"("identity_id", "routine_id", "occurrence_key");

CREATE INDEX IF NOT EXISTS "routine_occurrences_identity_id_idx"
  ON "routine_occurrences"("identity_id");

CREATE INDEX IF NOT EXISTS "routine_occurrences_status_idx"
  ON "routine_occurrences"("status");

CREATE INDEX IF NOT EXISTS "routine_occurrences_lease_expires_at_idx"
  ON "routine_occurrences"("lease_expires_at");