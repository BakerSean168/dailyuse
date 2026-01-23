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

-- AlterTable - Convert goals.importance from Int to String enum
-- First, add a temporary column for the old data
ALTER TABLE "goals" ADD COLUMN "importance_temp" TEXT;

-- Copy and convert the importance values: 0=trivial, 1=minor, 2=moderate, 3=important, 4=vital
UPDATE "goals" SET "importance_temp" = CASE
  WHEN "importance" = 0 THEN 'trivial'
  WHEN "importance" = 1 THEN 'minor'
  WHEN "importance" = 2 THEN 'moderate'
  WHEN "importance" = 3 THEN 'important'
  WHEN "importance" = 4 THEN 'vital'
  ELSE 'moderate'  -- Default fallback
END;

-- Drop the old column and rename the temp column
ALTER TABLE "goals" DROP COLUMN "importance";
ALTER TABLE "goals" RENAME COLUMN "importance_temp" TO "importance";

-- Set the default
ALTER TABLE "goals" ALTER COLUMN "importance" SET DEFAULT 'moderate';

-- AlterTable
ALTER TABLE "repositories" ALTER COLUMN "created_at" SET DEFAULT extract(epoch from now())::bigint * 1000,
ALTER COLUMN "updated_at" SET DEFAULT extract(epoch from now())::bigint * 1000;

-- AlterTable
ALTER TABLE "resources" ALTER COLUMN "created_at" SET DEFAULT extract(epoch from now())::bigint * 1000,
ALTER COLUMN "updated_at" SET DEFAULT extract(epoch from now())::bigint * 1000;

-- AlterTable - Convert task_templates.importance from Int to String enum
-- First, add a temporary column for the old data
ALTER TABLE "task_templates" ADD COLUMN "importance_temp" TEXT;

-- Copy and convert the importance values: 0=trivial, 1=minor, 2=moderate, 3=important, 4=vital
UPDATE "task_templates" SET "importance_temp" = CASE
  WHEN "importance" = 0 THEN 'trivial'
  WHEN "importance" = 1 THEN 'minor'
  WHEN "importance" = 2 THEN 'moderate'
  WHEN "importance" = 3 THEN 'important'
  WHEN "importance" = 4 THEN 'vital'
  ELSE 'moderate'  -- Default fallback
END;

-- Drop the old column and rename the temp column
ALTER TABLE "task_templates" DROP COLUMN "importance";
ALTER TABLE "task_templates" RENAME COLUMN "importance_temp" TO "importance";

-- Set the default
ALTER TABLE "task_templates" ALTER COLUMN "importance" SET DEFAULT 'moderate';
