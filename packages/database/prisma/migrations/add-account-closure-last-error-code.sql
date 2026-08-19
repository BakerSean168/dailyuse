-- Account closure saga persists a machine-readable failure code alongside the
-- diagnostic `last_error`. The Prisma schema (reliable_account_closure_operations)
-- already carries `last_error_code`; the default deploy path is Prisma schema
-- reconciliation (`prisma db push`), which propagates the column automatically.
-- This ALTER is only needed for an explicit/manual migration of a database that
-- predates ACR-049 (#234) and is maintained outside Prisma's reconciliation.
ALTER TABLE "reliable_account_closure_operations" ADD COLUMN IF NOT EXISTS "last_error_code" TEXT;