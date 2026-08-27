import { describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'crypto';
import {
  buildSchedulingKey,
  SourceModule,
  type SourceModule as SourceModuleValue,
} from '@memoflow/contracts/schedule';
import type { NotificationRequestedWriterPort } from '@memoflow/contracts/notification';
import {
  ReminderTimeUnit,
  TaskInstanceStatus,
  TaskReminderType,
  TaskTemplateStatus,
} from '@memoflow/contracts/task';
import { GoalStatus, ReminderTriggerType } from '@memoflow/contracts/goal';
import { createTaskReminderScheduledHandlerRegistration } from '@memoflow/task/schedule-execution';
import { createGoalReminderFireHandler } from '@memoflow/goal/schedule-execution';
import { ScheduleTask } from '@memoflow/schedule';
import { createScheduleExecutionRouter } from '../execution/router';

function createScheduleTask(sourceModule: SourceModuleValue) {
  return ScheduleTask.create({
    identityId: 'IdentityId_schedule-owner',
    name: 'Execution Router Test',
    sourceModule,
    sourceEntityId: 'entity-1',
    schedule: {
      cronExpression: null,
      timezone: 'Asia/Shanghai',
      startDate: new Date('2030-01-10T08:45:00.000Z').toISOString(),
      endDate: null,
      maxExecutions: 1,
    },
    metadata: { payload: {}, tags: ['test'], priority: 'Normal', timeout: null },
  });
}

describe('schedule execution router (NOTIF-3302)', () => {
  it.each([
    [SourceModule.Reminder, 'executeReminder'],
    [SourceModule.Goal, 'executeGoal'],
    [SourceModule.Task, 'executeTask'],
  ] as const)(
    'routes %s and returns the business source result unchanged',
    async (sourceModule, method) => {
      const outcome = { nextRunAt: null, result: { ok: sourceModule } };
      const reminderSource = { executeReminder: vi.fn().mockResolvedValue(outcome) };
      const goalSource = { executeGoal: vi.fn().mockResolvedValue(outcome) };
      const taskSource = { executeTask: vi.fn().mockResolvedValue(outcome) };
      const router = createScheduleExecutionRouter({ reminderSource, goalSource, taskSource });
      const task = createScheduleTask(sourceModule);

      await expect(router.execute(task)).resolves.toEqual(outcome);
      const source = {
        executeReminder: reminderSource.executeReminder,
        executeGoal: goalSource.executeGoal,
        executeTask: taskSource.executeTask,
      }[method];
      expect(source).toHaveBeenCalledWith(task);
    },
  );

  it('throws for unsupported schedule source modules', async () => {
    const router = createScheduleExecutionRouter({
      reminderSource: { executeReminder: vi.fn() },
      goalSource: { executeGoal: vi.fn() },
      taskSource: { executeTask: vi.fn() },
    });
    await expect(router.execute(createScheduleTask(SourceModule.Custom))).rejects.toThrow(
      'Unsupported schedule source module: Custom',
    );
  });

  describe('wakes business handlers without delivering notifications itself', () => {
    const identityId = 'IdentityId_schedule-owner';
    const schedulingKey = buildSchedulingKey('task.reminder', 'task-instance', 'relative:30:Minutes');
    const RUN_AT = Date.UTC(2030, 0, 10, 8, 45);

    function createSpyWriter() {
      const enqueueNotificationRequested = vi.fn().mockImplementation(
        async (input: { operationId: string }) => ({
          operationId: input.operationId,
          status: 'succeeded',
          identityId,
        }),
      );
      return {
        writer: { enqueueNotificationRequested } as unknown as NotificationRequestedWriterPort,
        enqueueNotificationRequested,
      };
    }

    it('routes a Task to task.reminder.fire and yields only a durable NotificationRequested envelope', async () => {
      const instanceId = `TaskInstanceId_${randomUUID()}`;
      const templateId = `TaskTemplateId_${randomUUID()}`;
      const { writer, enqueueNotificationRequested } = createSpyWriter();
      const taskInstance = {
        id: instanceId,
        identityId,
        templateId,
        occurrenceKey: null,
        status: TaskInstanceStatus.Pending,
        deletedAt: null,
      };
      const taskTemplate = {
        toServerDTO: () => ({
          id: templateId,
          identityId,
          name: 'Exercise 30 minutes',
          status: TaskTemplateStatus.Active,
          deletedAt: null,
          reminderConfig: {
            enabled: true,
            triggers: [
              {
                type: TaskReminderType.Relative,
                relativeValue: 30,
                relativeUnit: ReminderTimeUnit.Minutes,
                absoluteTime: null,
              },
            ],
          },
        }),
      };
      const registration = createTaskReminderScheduledHandlerRegistration({
        taskInstanceRepository: {
          findByIdForIdentity: vi.fn().mockResolvedValue(taskInstance),
        },
        taskTemplateRepository: {
          findByIdForIdentity: vi.fn().mockResolvedValue(taskTemplate),
        },
        notificationRequestedWriter: writer,
      });

      const taskSource = {
        executeTask: vi.fn(async (task: ScheduleTask) => {
          const result = await registration.handler.execute({
            identityId,
            owner: { identityId, type: 'task.template', id: templateId },
            schedulingKey,
            handlerKey: registration.handlerKey,
            runAt: task.schedule.startDate ?? RUN_AT,
            payloadVersion: registration.payloadVersion,
            payload: {
              templateId,
              instanceId,
              occurrenceKey: null,
              taskTitle: 'Exercise 30 minutes',
              reminderType: TaskReminderType.Relative,
              reminderValue: 30,
              reminderUnit: ReminderTimeUnit.Minutes,
              reminderAbsoluteTime: null,
              anchorTime: 1_704_000_000_000,
              reminderTime: 1_704_000_000_000 - 30 * 60_000,
            },
          });
          return { nextRunAt: null, result: result.status === 'succeeded' ? result.result : {} };
        }),
      };

      // NOTIF-3302 removed the NotificationPort/delivery seam from the router.
      // The sentinel stands in for that removed direct-delivery path and must
      // never be reached while waking business handlers.
      const directDeliveryChannel = { deliver: vi.fn() };
      const router = createScheduleExecutionRouter({
        reminderSource: { executeReminder: vi.fn() },
        goalSource: { executeGoal: vi.fn() },
        taskSource,
        ...(directDeliveryChannel as unknown as Record<string, unknown>),
      });

      const outcome = await router.execute(createScheduleTask(SourceModule.Task));

      // The scheduler woke the handler exactly once and returned its result.
      expect(taskSource.executeTask).toHaveBeenCalledTimes(1);
      // The handler's ONLY notification side effect is the durable envelope.
      expect(enqueueNotificationRequested).toHaveBeenCalledTimes(1);
      const envelope = enqueueNotificationRequested.mock.calls[0][0].envelope;
      expect(envelope).toMatchObject({
        source: 'task',
        workflowKey: 'task.reminder',
        relatedEntity: { type: 'Task', id: instanceId },
      });
      // No direct delivery: no Fact id, no dispatch-outbox row, no deliveredAt,
      // no channel status, and the removed delivery seam is never touched.
      expect(directDeliveryChannel.deliver).not.toHaveBeenCalled();
      const serialized = JSON.stringify(outcome);
      expect(serialized).not.toContain('notification.dispatch');
      expect(serialized).not.toContain('notificationFactId');
      expect(serialized).not.toContain('deliveredAt');
    });

    it('routes a Goal to goal.reminder.fire and yields only a durable NotificationRequested envelope', async () => {
      const goalId = `GoalId_${randomUUID()}`;
      const goalSchedulingKey = `${goalId}|2026-08-10T08:45:00.000Z`;
      const { writer, enqueueNotificationRequested } = createSpyWriter();
      const goal = {
        toServerDTO: () => ({
          id: goalId,
          identityId,
          name: 'Ship R06',
          description: null,
          status: GoalStatus.Active,
          deletedAt: null,
          archivedAt: null,
          completedAt: null,
          reminderConfig: {
            enabled: true,
            triggers: [
              { type: ReminderTriggerType.RemainingDays, value: 3, enabled: true },
            ],
          },
        }),
      };
      const registration = createGoalReminderFireHandler({
        goalRepository: {
          findByIdForIdentity: vi.fn().mockResolvedValue(goal),
        },
        requestedWriter: writer,
      });

      const goalSource = {
        executeGoal: vi.fn(async (task: ScheduleTask) => {
          const result = await registration.handler.execute({
            identityId,
            owner: { identityId, type: 'Identity', id: identityId },
            schedulingKey: goalSchedulingKey,
            handlerKey: registration.handlerKey,
            runAt: task.schedule.startDate ?? RUN_AT,
            payloadVersion: registration.payloadVersion,
            payload: {
              goalId,
              goalTitle: 'Ship R06',
              triggerType: ReminderTriggerType.RemainingDays,
              triggerValue: 3,
              startDate: Date.UTC(2026, 1, 1),
              dueDate: Date.UTC(2026, 8, 1),
              reminderTime: 8 * 60,
            },
          });
          return { nextRunAt: null, result: result.status === 'succeeded' ? result.result : {} };
        }),
      };

      const directDeliveryChannel = { deliver: vi.fn() };
      const router = createScheduleExecutionRouter({
        reminderSource: { executeReminder: vi.fn() },
        goalSource,
        taskSource: { executeTask: vi.fn() },
        ...(directDeliveryChannel as unknown as Record<string, unknown>),
      });

      const outcome = await router.execute(createScheduleTask(SourceModule.Goal));

      expect(goalSource.executeGoal).toHaveBeenCalledTimes(1);
      expect(enqueueNotificationRequested).toHaveBeenCalledTimes(1);
      const envelope = enqueueNotificationRequested.mock.calls[0][0].envelope;
      expect(envelope).toMatchObject({
        source: 'goal-reminder',
        workflowKey: 'goal.reminder',
        relatedEntity: { type: 'Goal', id: goalId },
      });
      expect(directDeliveryChannel.deliver).not.toHaveBeenCalled();
      const serialized = JSON.stringify(outcome);
      expect(serialized).not.toContain('notification.dispatch');
      expect(serialized).not.toContain('notificationFactId');
      expect(serialized).not.toContain('deliveredAt');
    });
  });
});
