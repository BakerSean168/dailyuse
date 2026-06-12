-- CreateTable
CREATE TABLE "agent_run_checkpoints" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "identity_id" TEXT NOT NULL,
    "conversation_id" TEXT,
    "thread_id" TEXT NOT NULL,
    "agent_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "run_metadata" JSONB NOT NULL,
    "state_snapshot" JSONB,
    "events" JSONB NOT NULL DEFAULT '[]',
    "interrupts" JSONB NOT NULL DEFAULT '[]',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "agent_run_checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_run_checkpoints_run_id_key" ON "agent_run_checkpoints"("run_id");

-- CreateIndex
CREATE INDEX "agent_run_checkpoints_identity_id_idx" ON "agent_run_checkpoints"("identity_id");

-- CreateIndex
CREATE INDEX "agent_run_checkpoints_conversation_id_idx" ON "agent_run_checkpoints"("conversation_id");

-- CreateIndex
CREATE INDEX "agent_run_checkpoints_status_idx" ON "agent_run_checkpoints"("status");

-- CreateIndex
CREATE INDEX "agent_run_checkpoints_agent_type_idx" ON "agent_run_checkpoints"("agent_type");

-- CreateIndex
CREATE INDEX "agent_run_checkpoints_created_at_idx" ON "agent_run_checkpoints"("created_at");

-- CreateIndex
CREATE INDEX "agent_run_checkpoints_updated_at_idx" ON "agent_run_checkpoints"("updated_at");

-- AddForeignKey
ALTER TABLE "agent_run_checkpoints" ADD CONSTRAINT "agent_run_checkpoints_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
