import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@memoflow/test-utils/helpers/result-matchers';
import { IdentityId } from '@memoflow/domain-shared';
import { ImportanceLevel } from '@memoflow/contracts/shared';
import { TaskType } from '@memoflow/contracts/task';
import { eventBus } from '@memoflow/utils/domain';
import { TaskTemplate } from '../../../domain/aggregates/task-template';
import { RecurrenceRule, TaskTimeConfig } from '../../../domain/value-objects';
import { createTaskPrismaModule } from '../../prisma';
import {
  cleanTaskTables,
  disconnectPrisma,
  getPrisma,
  seedAccount,
} from '../../../../__tests__/integration-helpers';
import { PrismaTaskWriteTransactionRunner } from './prisma-task-write-transaction-runner';
import { TaskInstancePrismaRepository } from './task-instance-prisma.repository';

describe('PrismaTaskWriteTransactionRunner integration', () => {
  afterAll(async () => {
    await disconnectPrisma();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    await cleanTaskTables();
  });

  it('publishes buffered domain events only after the transaction commits', async () => {
    const identityId = IdentityId.generate();
    await seedAccount({ id: identityId });

    const prisma = await getPrisma();
    const runner = new PrismaTaskWriteTransactionRunner(prisma);
    const sendSpy = vi.spyOn(eventBus, 'send').mockImplementation(() => undefined);
    const template = TaskTemplate.create({
      identityId,
      title: 'Daily Review',
      taskType: TaskType.Recurring,
      timeConfig: TaskTimeConfig.createAllDay(new Date()),
      recurrenceRule: RecurrenceRule.createDaily(1),
      importance: ImportanceLevel.Moderate,
      tags: [],
    });

    let sentBeforeCommit = false;

    await runner.run(async ({ templateRepository }) => {
      await templateRepository.save(template);
      sentBeforeCommit = sendSpy.mock.calls.length > 0;
    });

    expect(sentBeforeCommit).toBe(false);
    expect(sendSpy).toHaveBeenCalledWith(
      'task:created',
      expect.objectContaining({ templateId: template.id }),
    );

    const saved = await prisma.taskTemplate.findUnique({
      where: { id: template.id },
    });
    expect(saved).not.toBeNull();
  });

  it('rolls back createTaskPrismaModule writes and publishes nothing when instance persistence fails', async () => {
    const identityId = IdentityId.generate();
    await seedAccount({ id: identityId });

    const prisma = await getPrisma();
    const module = createTaskPrismaModule(prisma);
    const sendSpy = vi.spyOn(eventBus, 'send').mockImplementation(() => undefined);
    vi.spyOn(TaskInstancePrismaRepository.prototype, 'saveMany').mockRejectedValue(
      new Error('saveMany failed'),
    );

    const result = await module.api.createTaskTemplate({
      identityId,
      name: 'Daily Review',
      taskType: TaskType.Recurring,
      timeConfig: {
        timeType: 'AllDay',
        startDate: Date.now(),
        timePoint: null,
        timeRange: null,
      },
      recurrenceRule: {
        frequency: 'Daily',
        interval: 1,
        daysOfWeek: [],
        endDate: null,
        occurrences: null,
      },
      importance: ImportanceLevel.Moderate,
      tags: [],
    });

    expect(result).toBeErrorWithCode('INTERNAL_ERROR');
    expect(await prisma.taskTemplate.count()).toBe(0);
    expect(await prisma.taskInstance.count()).toBe(0);
    expect(sendSpy).not.toHaveBeenCalled();

    module.dispose();
  });
});
