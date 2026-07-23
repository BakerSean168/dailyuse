/**
 * Residual 1043: shared integration helpers dual retired onto test-utils sole.
 * Task-only seed/cleanup helpers remain local (not cross-package duals).
 */
import { getPrisma } from '../../../test-utils/src/setup/integration-helpers';
import { TaskFolderId, TaskInstanceId, TaskTemplateId } from '../server/domain/value-objects';

export {
  getPrisma,
  disconnectPrisma,
  cleanAll,
  seedAccount,
} from '../../../test-utils/src/setup/integration-helpers';

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
