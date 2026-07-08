/**
 * Integration test helpers for the task module.
 *
 * Provides:
 * - A shared PrismaClient pointing to the test database
 * - Seed helpers that respect FK constraints (AuthIdentity → Account → Task*)
 * - Table cleanup between tests
 *
 * IMPORTANT: DATABASE_URL must be set in the environment BEFORE calling
 * `getPrisma()`. The vitest `task-integration` project sets this via env config.
 */
import type { PrismaClient } from '@dailyuse/database';
import { cleanAllTables } from '@dailyuse/test-utils/setup/database';
import { IdentityId } from '@dailyuse/domain-shared';
import { TaskFolderId, TaskInstanceId, TaskTemplateId } from '../server/domain/value-objects';

// ─── Shared PrismaClient ────────────────────────────────────────────

let prismaPromise: Promise<PrismaClient> | null = null;

/**
 * Get the PrismaClient connected to the test database.
 */
export async function getPrisma(): Promise<PrismaClient> {
  if (!prismaPromise) {
    prismaPromise = import('@dailyuse/database').then((module) => module.prisma);
  }
  return prismaPromise;
}

/**
 * Disconnect the shared PrismaClient. Call in afterAll().
 */
export async function disconnectPrisma(): Promise<void> {
  const prisma = await getPrisma();
  await prisma.$disconnect();
  prismaPromise = null;
}

// ─── Table Cleanup ──────────────────────────────────────────────────

/**
 * Truncate ALL tables (including auth/account). Use only in final teardown.
 */
export async function cleanAll(): Promise<void> {
  const prisma = await getPrisma();
  await cleanAllTables(prisma);
}

/**
 * Delete only task-related tables, preserving AuthIdentity and Account rows.
 * Use this in beforeEach() to avoid FK violations on identity_id.
 *
 * Deletion order respects FK constraints:
 *   TaskDependency → TaskInstance → TaskTemplate → TaskFolder
 */
export async function cleanTaskTables(): Promise<void> {
  const prisma = await getPrisma();
  await prisma.taskDependency.deleteMany();
  await prisma.taskInstance.deleteMany();
  await prisma.taskTemplateHistory.deleteMany();
  await prisma.taskTemplate.deleteMany();
  await prisma.taskFolder.deleteMany();
  await prisma.taskStatistic.deleteMany();
}

// ─── Seed Helpers ───────────────────────────────────────────────────

/**
 * Seed an AuthIdentity + Account pair.
 * Returns the shared identityId (Account.id == AuthIdentity.id).
 *
 * FK chain: AuthIdentity → Account
 */
export async function seedAccount(
  overrides: {
    id?: string;
    emailAddress?: string;
    profile?: Record<string, unknown>;
    settings?: Record<string, unknown>;
    status?: string;
  } = {},
) {
  const prisma = await getPrisma();
  const id = overrides.id ?? IdentityId.generate();
  const emailAddress =
    overrides.emailAddress ??
    `task-int-${id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@example.test`;

  await prisma.authIdentity.upsert({
    where: { id },
    update: {
      status: 'Unverified',
      failedLoginAttempts: 0,
      lastFailedAttempt: null,
      lockedUntil: null,
      deletedAt: null,
    },
    create: {
      id,
      status: 'Unverified',
    },
  });

  return prisma.account.upsert({
    where: { id },
    update: {
      status: overrides.status ?? 'ACTIVE',
      profile: overrides.profile ?? {},
      settings: overrides.settings ?? {},
      emailAddress,
      emailIsVerified: true,
      emailVerifiedAt: new Date(),
      emailIsPrimary: true,
      deletedAt: null,
    },
    create: {
      id,
      status: overrides.status ?? 'ACTIVE',
      profile: overrides.profile ?? {},
      settings: overrides.settings ?? {},
      emailAddress,
      emailIsVerified: true,
      emailVerifiedAt: new Date(),
      emailIsPrimary: true,
    },
  });
}

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
  const prisma = await getPrisma();
  const id = overrides.id ?? TaskFolderId.generate();

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
  const prisma = await getPrisma();
  const id = overrides.id ?? TaskTemplateId.generate();

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
  const prisma = await getPrisma();
  const id = overrides.id ?? TaskInstanceId.generate();

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
