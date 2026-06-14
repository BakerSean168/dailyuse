-- CreateTable
CREATE TABLE IF NOT EXISTS "langgraph_checkpoints" (
    "id" TEXT NOT NULL,
    "identity_id" TEXT NOT NULL,
    "agent_type" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "checkpoint_ns" TEXT NOT NULL DEFAULT '',
    "checkpoint_id" TEXT NOT NULL,
    "parent_checkpoint_id" TEXT,
    "checkpoint_type" TEXT NOT NULL,
    "checkpoint_blob" BYTEA NOT NULL,
    "metadata_type" TEXT NOT NULL,
    "metadata_blob" BYTEA NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "langgraph_checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "langgraph_checkpoint_writes" (
    "id" TEXT NOT NULL,
    "identity_id" TEXT NOT NULL,
    "agent_type" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "checkpoint_ns" TEXT NOT NULL DEFAULT '',
    "checkpoint_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "task_path" TEXT NOT NULL DEFAULT '',
    "idx" INTEGER NOT NULL,
    "channel" TEXT NOT NULL,
    "value_type" TEXT NOT NULL,
    "value_blob" BYTEA NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "langgraph_checkpoint_writes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "lg_ckpt_identity_thread_checkpoint_uq"
ON "langgraph_checkpoints"("identity_id", "agent_type", "thread_id", "checkpoint_ns", "checkpoint_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "lg_ckpt_identity_thread_created_idx"
ON "langgraph_checkpoints"("identity_id", "agent_type", "thread_id", "checkpoint_ns", "created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "lg_ckpt_identity_thread_checkpoint_idx"
ON "langgraph_checkpoints"("identity_id", "agent_type", "thread_id", "checkpoint_ns", "checkpoint_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "lg_ckpt_identity_thread_parent_idx"
ON "langgraph_checkpoints"("identity_id", "agent_type", "thread_id", "checkpoint_ns", "parent_checkpoint_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "lg_cpw_identity_checkpoint_task_uq"
ON "langgraph_checkpoint_writes"("identity_id", "agent_type", "thread_id", "checkpoint_ns", "checkpoint_id", "task_id", "idx");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "lg_cpw_identity_checkpoint_created_idx"
ON "langgraph_checkpoint_writes"("identity_id", "agent_type", "thread_id", "checkpoint_ns", "checkpoint_id", "created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "lg_cpw_identity_checkpoint_task_idx"
ON "langgraph_checkpoint_writes"("identity_id", "agent_type", "thread_id", "checkpoint_ns", "checkpoint_id", "task_id");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'lg_ckpt_identity_fk'
    ) THEN
        ALTER TABLE "langgraph_checkpoints"
        ADD CONSTRAINT "lg_ckpt_identity_fk"
        FOREIGN KEY ("identity_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'lg_cpw_identity_fk'
    ) THEN
        ALTER TABLE "langgraph_checkpoint_writes"
        ADD CONSTRAINT "lg_cpw_identity_fk"
        FOREIGN KEY ("identity_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
