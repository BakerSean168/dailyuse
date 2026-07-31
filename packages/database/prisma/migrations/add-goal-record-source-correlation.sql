ALTER TABLE "goal_records"
  ADD COLUMN "source_type" TEXT,
  ADD COLUMN "source_id" TEXT;

CREATE UNIQUE INDEX "goal_records_identity_id_source_type_source_id_key"
  ON "goal_records"("identity_id", "source_type", "source_id");
