-- GitHub App authorization is independent from login OAuth. These tables hold
-- only installation/repository identifiers and rebuildable projection state;
-- installation access tokens are deliberately never persisted.

-- CreateTable
CREATE TABLE "knowledge_repository_connections" (
    "id" TEXT NOT NULL,
    "identity_id" TEXT NOT NULL,
    "github_user_id" TEXT NOT NULL,
    "github_repository_id" TEXT NOT NULL,
    "github_repository_full_name" TEXT NOT NULL,
    "installation_id" TEXT NOT NULL,
    "default_branch" TEXT NOT NULL DEFAULT 'main',
    "is_private" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'PENDING_INSTALL',
    "last_synced_commit_sha" TEXT,
    "last_projected_commit_sha" TEXT,
    "last_error_code" TEXT,
    "last_error_message" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "knowledge_repository_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "github_webhook_deliveries" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "delivery_id" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "before_sha" TEXT,
    "after_sha" TEXT,
    "forced" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "error_message" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "github_webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_note_projections" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "relative_path" TEXT NOT NULL,
    "commit_sha" TEXT NOT NULL,
    "blob_sha" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "frontmatter" JSONB NOT NULL DEFAULT '{}',
    "markdown_content" TEXT NOT NULL,
    "index_status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "knowledge_note_projections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "knowledge_attachment_projections" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "relative_path" TEXT NOT NULL,
    "commit_sha" TEXT NOT NULL,
    "blob_sha" TEXT NOT NULL,
    "byte_size" INTEGER,
    "media_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "knowledge_attachment_projections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_write_requests" (
    "id" TEXT NOT NULL,
    "identity_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "request_hash" TEXT NOT NULL,
    "relative_path" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "commit_sha" TEXT,
    "error_code" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "knowledge_write_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_repository_connections_identity_id_github_repository_id_key"
ON "knowledge_repository_connections"("identity_id", "github_repository_id");
CREATE UNIQUE INDEX "knowledge_repository_connections_github_repository_id_key"
ON "knowledge_repository_connections"("github_repository_id");
CREATE INDEX "knowledge_repository_connections_identity_id_status_idx"
ON "knowledge_repository_connections"("identity_id", "status");
CREATE INDEX "knowledge_repository_connections_installation_id_idx"
ON "knowledge_repository_connections"("installation_id");

CREATE UNIQUE INDEX "github_webhook_deliveries_delivery_id_key"
ON "github_webhook_deliveries"("delivery_id");
CREATE INDEX "github_webhook_deliveries_connection_id_status_idx"
ON "github_webhook_deliveries"("connection_id", "status");

CREATE UNIQUE INDEX "knowledge_note_projections_connection_id_relative_path_key"
ON "knowledge_note_projections"("connection_id", "relative_path");
CREATE INDEX "knowledge_note_projections_connection_id_commit_sha_idx"
ON "knowledge_note_projections"("connection_id", "commit_sha");
CREATE INDEX "knowledge_note_projections_content_hash_idx"
ON "knowledge_note_projections"("content_hash");
CREATE INDEX "knowledge_note_projections_index_status_idx"
ON "knowledge_note_projections"("index_status");

CREATE UNIQUE INDEX "knowledge_attachment_projections_connection_id_relative_path_key"
ON "knowledge_attachment_projections"("connection_id", "relative_path");
CREATE INDEX "knowledge_attachment_projections_connection_id_commit_sha_idx"
ON "knowledge_attachment_projections"("connection_id", "commit_sha");
CREATE INDEX "knowledge_attachment_projections_blob_sha_idx"
ON "knowledge_attachment_projections"("blob_sha");

CREATE TABLE "knowledge_attachment_content_cache" (
    "connection_id" TEXT NOT NULL,
    "blob_sha" TEXT NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "content_bytes" BYTEA NOT NULL,
    "cached_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_attachment_content_cache_pkey" PRIMARY KEY ("connection_id", "blob_sha")
);

CREATE INDEX "knowledge_attachment_content_cache_expires_at_idx"
ON "knowledge_attachment_content_cache"("expires_at");

ALTER TABLE "knowledge_attachment_content_cache"
ADD CONSTRAINT "knowledge_attachment_content_cache_connection_id_fkey"
FOREIGN KEY ("connection_id") REFERENCES "knowledge_repository_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "knowledge_write_requests_identity_id_request_id_key"
ON "knowledge_write_requests"("identity_id", "request_id");
CREATE INDEX "knowledge_write_requests_connection_id_status_idx"
ON "knowledge_write_requests"("connection_id", "status");

-- AddForeignKey
ALTER TABLE "knowledge_repository_connections"
ADD CONSTRAINT "knowledge_repository_connections_identity_id_fkey"
FOREIGN KEY ("identity_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "github_webhook_deliveries"
ADD CONSTRAINT "github_webhook_deliveries_connection_id_fkey"
FOREIGN KEY ("connection_id") REFERENCES "knowledge_repository_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "knowledge_note_projections"
ADD CONSTRAINT "knowledge_note_projections_connection_id_fkey"
FOREIGN KEY ("connection_id") REFERENCES "knowledge_repository_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "knowledge_attachment_projections"
ADD CONSTRAINT "knowledge_attachment_projections_connection_id_fkey"
FOREIGN KEY ("connection_id") REFERENCES "knowledge_repository_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "knowledge_write_requests"
ADD CONSTRAINT "knowledge_write_requests_identity_id_fkey"
FOREIGN KEY ("identity_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "knowledge_write_requests"
ADD CONSTRAINT "knowledge_write_requests_connection_id_fkey"
FOREIGN KEY ("connection_id") REFERENCES "knowledge_repository_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Distributed claim/lease rows are short-lived and contain no credentials or
-- user content. Expired rows are reused by the conditional acquisition query.
CREATE TABLE "knowledge_repository_leases" (
    "id" TEXT NOT NULL,
    "lease_key" TEXT NOT NULL,
    "owner_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_repository_leases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "knowledge_repository_leases_lease_key_key"
ON "knowledge_repository_leases"("lease_key");
CREATE INDEX "knowledge_repository_leases_expires_at_idx"
ON "knowledge_repository_leases"("expires_at");
