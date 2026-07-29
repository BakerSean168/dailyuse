import { describe, expect, it, vi } from 'vitest';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import type { ITaskInstanceRepository } from '../domain/repositories/i-task-instance-repository';
import type { ITaskTemplateRepository } from '../domain/repositories/i-task-template-repository';
import {
  aRecurringTask,
  aRelativeReminder,
  aTaskInstance,
  anAllDayTimeConfig,
  anIdentityId,
} from '../../testing';
import { SourceModule } from '@memoflow/contracts/schedule';
import { ScheduleTask } from '@memoflow/schedule';
import {
  createTaskScheduleProjectionEventHandlers,
  createTaskScheduleProjectionSource,
  taskScheduleProjectionEventNames,
} from './schedule-projection-source';

function aScheduleTaskForSelection(templateId: string, sourceEntityId: string) {
  return ScheduleTask.create({
    identityId: String(anIdentityId()),
    name: 'Selection Task',
    sourceModule: SourceModule.Task,
    sourceEntityId,
    schedule: {
      cronExpression: null,
      timezone: 'Asia/Shanghai',
      startDate: new Date('2030-01-10T08:45:00.000Z').toISOString(),
      endDate: null,
      maxExecutions: 1,
    },
    metadata: {
      payload: { templateId },
      tags: ['task'],
      priority: 'Normal',
      timeout: null,
    },
  });
}

describe('task schedule projection source', () => {
  it('builds a template projection plan and keeps template matching local to task', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-01T00:00:00.000Z'));

    try {
      const identityId = anIdentityId();
      const template = aRecurringTask({
        identityId,
        title: 'Pay rent',
        reminderConfig: aRelativeReminder(15),
        timeConfig: anAllDayTimeConfig(new Date('2030-01-10T00:00:00.000Z')),
      });
      const futureInstance = await aTaskInstance({
        identityId,
        templateId: template.id,
        instanceDate: new Date('2030-01-10T00:00:00.000Z').getTime(),
        timeConfig: anAllDayTimeConfig(new Date('2030-01-10T00:00:00.000Z')),
      });
      const pastInstance = await aTaskInstance({
        identityId,
        templateId: template.id,
        instanceDate: new Date('2029-12-10T00:00:00.000Z').getTime(),
        timeConfig: anAllDayTimeConfig(new Date('2029-12-10T00:00:00.000Z')),
      });

      const findByIdForIdentity = vi.fn().mockResolvedValue(template);
      const findById = vi.fn();
      const taskTemplateRepository = createMockRepo<ITaskTemplateRepository>({
        findById,
        findByIdForIdentity,
      });
      const taskInstanceRepository = createMockRepo<ITaskInstanceRepository>({
        findByTemplateId: vi.fn().mockResolvedValue([futureInstance, pastInstance]),
      });

      const source = createTaskScheduleProjectionSource({
        taskTemplateRepository,
        taskInstanceRepository,
      });

      const plan = await source.buildTemplatePlan(template.id, String(identityId));

      expect(findByIdForIdentity).toHaveBeenCalledWith(String(identityId), template.id);
      expect(findById).not.toHaveBeenCalled();
      expect(plan.selection.sourceModule).toBe(SourceModule.Task);
      expect(plan.selection.identityId).toBe(String(identityId));
      expect(plan.nextTasks).toHaveLength(1);
      expect(plan.nextTasks[0]?.sourceEntityId).toBe(futureInstance.id);
      expect(plan.nextTasks[0]?.metadata.payload['templateId']).toBe(template.id);
      expect(plan.nextTasks[0]?.metadata.payload['instanceId']).toBe(futureInstance.id);
      expect(plan.selection.matches(aScheduleTaskForSelection(template.id, futureInstance.id))).toBe(true);
      expect(plan.selection.matches(aScheduleTaskForSelection('other-template', futureInstance.id))).toBe(
        false,
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('returns an empty plan when the template is not schedulable', async () => {
    const template = aRecurringTask({
      reminderConfig: aRelativeReminder(15),
    });
    template.pause();

    const findByIdForIdentity = vi.fn().mockResolvedValue(template);
    const findById = vi.fn();
    const taskTemplateRepository = createMockRepo<ITaskTemplateRepository>({
      findById,
      findByIdForIdentity,
    });
    const taskInstanceRepository = createMockRepo<ITaskInstanceRepository>({
      findByTemplateId: vi.fn().mockResolvedValue([]),
    });

    const source = createTaskScheduleProjectionSource({
      taskTemplateRepository,
      taskInstanceRepository,
    });

    const plan = await source.buildTemplatePlan(template.id, String(template.identityId));

    expect(findByIdForIdentity).toHaveBeenCalledWith(String(template.identityId), template.id);
    expect(findById).not.toHaveBeenCalled();
    expect(plan.nextTasks).toEqual([]);
    expect(plan.selection.matches(aScheduleTaskForSelection(template.id, 'instance-1'))).toBe(true);
  });


  it('loads missing template via findByIdForIdentity and returns empty plan', async () => {
    const findById = vi.fn();
    const findByIdForIdentity = vi.fn().mockResolvedValue(null);
    const taskTemplateRepository = createMockRepo<ITaskTemplateRepository>({
      findById,
      findByIdForIdentity,
    });
    const taskInstanceRepository = createMockRepo<ITaskInstanceRepository>({
      findByTemplateId: vi.fn().mockResolvedValue([]),
    });

    const source = createTaskScheduleProjectionSource({
      taskTemplateRepository,
      taskInstanceRepository,
    });

    const plan = await source.buildTemplatePlan('TaskTemplateId_missing', 'identity-1');

    expect(findByIdForIdentity).toHaveBeenCalledWith('identity-1', 'TaskTemplateId_missing');
    expect(findById).not.toHaveBeenCalled();
    expect(plan.nextTasks).toEqual([]);
    expect(plan.selection.identityId).toBe('identity-1');
  });

  it('builds an instance deletion selection by exact source entity id', () => {
    const source = createTaskScheduleProjectionSource({
      taskTemplateRepository: createMockRepo<ITaskTemplateRepository>({}),
      taskInstanceRepository: createMockRepo<ITaskInstanceRepository>({}),
    });

    const selection = source.buildInstanceDeletionSelection('instance-42', 'identity-1');

    expect(selection.sourceEntityId).toBe('instance-42');
    expect(selection.matches(aScheduleTaskForSelection('template-1', 'instance-42'))).toBe(true);
    expect(selection.matches(aScheduleTaskForSelection('template-1', 'instance-99'))).toBe(false);
  });

  it('maps task domain events to projection actions', async () => {
    const upsertTemplate = vi.fn().mockResolvedValue(undefined);
    const deleteTemplate = vi.fn().mockResolvedValue(undefined);
    const deleteInstance = vi.fn().mockResolvedValue(undefined);

    const handlers = createTaskScheduleProjectionEventHandlers({
      upsertTemplate,
      deleteTemplate,
      deleteInstance,
    });

    expect(taskScheduleProjectionEventNames).toContain('task:created');
    expect(taskScheduleProjectionEventNames).toContain('task:instance-deleted');

    await handlers['task:created']({
      identityId: 'IdentityId_test',
      templateId: 'TaskTemplateId_template',
      goalId: null,
      task: { id: 'TaskTemplateId_template' },
    } as never);
    await handlers['task:template-paused']({
      identityId: 'IdentityId_test',
      taskTemplateId: 'TaskTemplateId_paused',
      pausedAt: Date.now(),
      taskTemplate: { id: 'TaskTemplateId_paused' },
    } as never);
    await handlers['task:instance-deleted']({
      identityId: 'IdentityId_test',
      taskInstanceId: 'TaskInstanceId_deleted',
      taskTemplateId: 'TaskTemplateId_template',
      deletedAt: Date.now(),
    } as never);

    expect(upsertTemplate).toHaveBeenCalledWith('TaskTemplateId_template', 'IdentityId_test');
    expect(deleteTemplate).toHaveBeenCalledWith('TaskTemplateId_paused', 'IdentityId_test');
    expect(deleteInstance).toHaveBeenCalledWith('TaskInstanceId_deleted', 'IdentityId_test');
  });
});
