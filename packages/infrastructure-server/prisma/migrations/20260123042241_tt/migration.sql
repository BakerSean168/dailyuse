/*
  Warnings:

  - Made the column `importance` on table `goals` required. This step will fail if there are existing NULL values in that column.
  - Made the column `importance` on table `task_templates` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "document_links" ALTER COLUMN "created_at" SET DEFAULT extract(epoch from now())::integer,
ALTER COLUMN "updated_at" SET DEFAULT extract(epoch from now())::integer;

-- AlterTable
ALTER TABLE "document_versions" ALTER COLUMN "created_at" SET DEFAULT extract(epoch from now())::integer;

-- AlterTable
ALTER TABLE "documents" ALTER COLUMN "created_at" SET DEFAULT extract(epoch from now())::integer,
ALTER COLUMN "updated_at" SET DEFAULT extract(epoch from now())::integer;

-- AlterTable
ALTER TABLE "folders" ALTER COLUMN "created_at" SET DEFAULT extract(epoch from now())::bigint * 1000,
ALTER COLUMN "updated_at" SET DEFAULT extract(epoch from now())::bigint * 1000;

-- AlterTable
ALTER TABLE "goals" ALTER COLUMN "importance" SET NOT NULL;

-- AlterTable
ALTER TABLE "repositories" ALTER COLUMN "created_at" SET DEFAULT extract(epoch from now())::bigint * 1000,
ALTER COLUMN "updated_at" SET DEFAULT extract(epoch from now())::bigint * 1000;

-- AlterTable
ALTER TABLE "resources" ALTER COLUMN "created_at" SET DEFAULT extract(epoch from now())::bigint * 1000,
ALTER COLUMN "updated_at" SET DEFAULT extract(epoch from now())::bigint * 1000;

-- AlterTable
ALTER TABLE "task_templates" ALTER COLUMN "importance" SET NOT NULL;

-- CreateIndex
CREATE INDEX "task_templates_importance_idx" ON "task_templates"("importance");
