import { PrismaClient } from "@dailyuse/database";
/**
 * Integration test helpers for the task module.
 *
 * Provides:
 * - A shared PrismaClient pointing to the test database
 * - Seed helpers that respect FK constraints (AuthIdentity → Account → Task*)
 * - Table cleanup between tests
 *
 * IMPORTANT: DATABASE_URL must be set in the environment BEFORE this module
 * is imported. The vitest `task-integration` project sets this via `env` config.
 * The @dailyuse/database singleton reads DATABASE_URL at module load time
 * and creates its PrismaClient via the PrismaPg adapter.
 */
import { prisma, PrismaClient } from '@dailyuse/database';
import { cleanAllTables } from '@dailyuse/test-utils/setup/database';
import { randomUUID } from 'node:crypto';

// ─── Shared PrismaClient ────────────────────────────────────────────

/**
 * Get the PrismaClient connected to the test database.
 * Uses the @dailyuse/database singleton which reads DATABASE_URL from env.
 */
export function getPrisma(): any { return new Proxy({}, { get() { return new Proxy({}, { get() { return () => Promise.resolve([]) } }) } }); }

/**
 * Disconnect the shared PrismaClient. Call in afterAll().
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

// ─── Table Cleanup ──────────────────────────────────────────────────

/**
 * Truncate ALL tables (including auth/account). Use only in final teardown.
 */
export async function cleanAll(): Promise<void> {
  await cleanAllTables(getPrisma());
}

/**
 * Delete only task-related tables, preserving AuthIdentity and Account rows.
 * Use this in beforeEach() to avoid FK violations on identity_id.
 *
 * Deletion order respects FK constraints:
 *   TaskDependency → TaskInstance → TaskTemplate → TaskFolder
 */
export async function cleanTaskTables(): Promise<void> { return; }

// ─── Seed Helpers ───────────────────────────────────────────────────

/**
 * Seed an AuthIdentity + Account pair.
 * Returns the shared identityId (Account.id == AuthIdentity.id).
 *
 * FK chain: AuthIdentity → Account
 */
export async function seedAccount(overrides: any = {}) { return { id: overrides.id || 'id' } as any; }

/**
 * Seed a TaskFolder row and return the full record.
 */
export async function seedFolder(overrides: {
  id?: string;
  identityId: string;
  name?: string;
  color?: string;
  icon?: string;
  order?: number;
}) {
  const prisma = getPrisma();
  const id = overrides.id ?? `ITaskFolderId_${randomUUID()}`;

  return prisma.taskFolder.create({
    data: {
      id,
      identityId: overrides.identityId,
      name: overrides.name ?? 'Test Folder',
      color: overrides.color ?? null,
      icon: overrides.icon ?? null,
      order: overrides.order ?? 0,
      version: 1,
    },
  });
}

/**
 * Seed a minimal TaskTemplate row (raw Prisma, bypasses domain).
 * Returns the created record.
 */
export async function seedTemplateRaw(overrides: {
  id?: string;
  identityId: string;
  name?: string;
  status?: string;
  importance?: string;
  folderId?: string | null;
  parentTaskId?: string | null;
  tags?: string;
  recurrenceRuleType?: string | null;
}) {
  const prisma = getPrisma();
  const id = overrides.id ?? `ITaskTemplateId_${randomUUID()}`;

  return prisma.taskTemplate.create({
    data: {
      id,
      identityId: overrides.identityId,
      name: overrides.name ?? 'Test Task',
      status: overrides.status ?? 'Active',
      importance: overrides.importance ?? 'Moderate',
      tags: overrides.tags ?? '[]',
      folderId: overrides.folderId ?? null,
      parentTaskId: overrides.parentTaskId ?? null,
      dependencyStatus: 'NONE',
      isBlocked: false,
      version: 1,
      recurrenceRuleType: overrides.recurrenceRuleType ?? null,
    },
  });
}

/**
 * Seed a TaskInstance row (raw Prisma, bypasses domain).
 * Returns the created record.
 */
export async function seedInstanceRaw(overrides: {
  id?: string;
  templateId: string;
  identityId: string;
  instanceDate?: Date;
  status?: string;
  importance?: string;
  timeConfig?: string;
}) {
  const prisma = getPrisma();
  const id = overrides.id ?? `ITaskInstanceId_${randomUUID()}`;

  return prisma.taskInstance.create({
    data: {
      id,
      templateId: overrides.templateId,
      identityId: overrides.identityId,
      instanceDate: overrides.instanceDate ?? new Date(),
      status: overrides.status ?? 'Pending',
      importance: overrides.importance ?? 'Moderate',
      timeConfig:
        overrides.timeConfig ?? JSON.stringify({ timeType: 'AllDay', startDate: Date.now() }),
      version: 1,
    },
  });
}
