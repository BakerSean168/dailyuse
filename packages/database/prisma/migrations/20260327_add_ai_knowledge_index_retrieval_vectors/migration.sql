DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;

  EXECUTE '
    ALTER TABLE "ai_knowledge_index_entries"
    ADD COLUMN IF NOT EXISTS "retrieval_vector" vector(48)
  ';

  EXECUTE '
    CREATE INDEX IF NOT EXISTS "ai_knowledge_index_entries_retrieval_vector_ivfflat_idx"
    ON "ai_knowledge_index_entries"
    USING ivfflat ("retrieval_vector" vector_cosine_ops)
    WITH (lists = 100)
  ';
EXCEPTION
  WHEN undefined_file THEN
    RAISE NOTICE ''pgvector extension is not available; skipping ai_knowledge_index_entries retrieval_vector setup'';
END $$;
