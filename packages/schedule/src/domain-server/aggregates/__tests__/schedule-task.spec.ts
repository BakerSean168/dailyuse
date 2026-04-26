import { describe, expect, it } from 'vitest';
import {
  ScheduleTaskStatus,
  SourceModule,
  Timezone,
} from '@dailyuse/contracts/schedule';
import { ScheduleTask } from '../schedule-task';
import { ScheduleConfig } from '../../value-objects/ScheduleConfig';

function aScheduleConfig() {
  return ScheduleConfig.fromDTO({
    cronExpression: '0 0 9 * * *',
    timezone: Timezone.Shanghai,
    startDate: null,
    endDate: null,
    maxExecutions: null,
  });
}

describe('ScheduleTask', () => {
  it('creates an active task with the next run precomputed', () => {
    const task = ScheduleTask.create({
      identityId: 'identity-1',
      name: 'Morning check-in',
      sourceModule: SourceModule.Task,
      sourceEntityId: 'task-1',
      schedule: aScheduleConfig(),
    });

    expect(task.status).toBe(ScheduleTaskStatus.Active);
    expect(task.enabled).toBe(true);
    expect(task.nextRunAt).toBeInstanceOf(Date);
  });

  it('pauses and resumes the task lifecycle consistently', () => {
    const task = ScheduleTask.create({
      identityId: 'identity-1',
      name: 'Reminder sync',
      sourceModule: SourceModule.Reminder,
      sourceEntityId: 'reminder-1',
      schedule: aScheduleConfig(),
    });

    task.pause('manual');
    expect(task.isPaused()).toBe(true);
    expect(task.enabled).toBe(false);

    task.resume();
    expect(task.isActive()).toBe(true);
    expect(task.enabled).toBe(true);
  });
});
