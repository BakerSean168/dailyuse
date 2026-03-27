CREATE TABLE "ai_knowledge_index_entries" (
  "id" TEXT NOT NULL,
  "identity_id" TEXT NOT NULL,
  "repository_id" TEXT NOT NULL,
  "resource_id" TEXT NOT NULL,
  "resource_path" TEXT NOT NULL,
  "title" TEXT,
  "mime_type" TEXT NOT NULL,
  "content_hash" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "summary" TEXT,
  "keywords" JSONB NOT NULL DEFAULT '[]',
  "embedding" JSONB,
  "chunks" JSONB,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "error" TEXT,
  "indexed_at" TIMESTAMP(3) NOT NULL,
  "last_requested_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "ai_knowledge_index_entries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ai_knowledge_index_entries_resource_id_key" UNIQUE ("resource_id"),
  CONSTRAINT "ai_knowledge_index_entries_identity_id_fkey"
    FOREIGN KEY ("identity_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ai_knowledge_index_entries_identity_id_idx"
  ON "ai_knowledge_index_entries"("identity_id");
CREATE INDEX "ai_knowledge_index_entries_repository_id_idx"
  ON "ai_knowledge_index_entries"("repository_id");
CREATE INDEX "ai_knowledge_index_entries_status_idx"
  ON "ai_knowledge_index_entries"("status");
CREATE INDEX "ai_knowledge_index_entries_last_requested_at_idx"
  ON "ai_knowledge_index_entries"("last_requested_at");
