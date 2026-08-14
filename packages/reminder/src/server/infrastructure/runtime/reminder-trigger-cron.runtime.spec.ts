/**
 * Reminder trigger cron runtime spec.
 * 提醒触发定时任务运行时测试。
 *
 * Verifies `createReminderTriggerCronRuntime` restores the merge-base cron
 * behavior as a module-owned runtime contribution: it wraps the every-minute
 * trigger scan, start/stop are idempotent, and when wired into
 * `createReminderModule({ runtimeContributions })` the cron starts with the
 * module (`instance.start()`) and stops on dispose — exactly the lifecycle the
 * merge-base API module owned.
 *
 * 验证 `createReminderTriggerCronRuntime` 把 merge-base 的 cron 行为恢复为模块自有
 * 运行时贡献：包装每分钟触发扫描，start/stop 幂等，且接入
 * `createReminderModule({ runtimeContributions })` 后，cron 随模块
 * `instance.start()` 启动、dispose 停止——正是 merge-base API 模块所拥有的生命周期。
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const start = vi.fn();
  const stop = vi.fn();
  const scheduledTasks: Array<{ start: typeof start; stop: typeof stop }> = [];
  const schedule = vi.fn((expression: string) => {
    expect(expression).toBe('* * * * *');
    const task = { start, stop };
    scheduledTasks.push(task);
    return task;
  });
  return { schedule, start, stop, scheduledTasks };
});

vi.mock('node-cron', () => ({
  default: { schedule: mocks.schedule },
  schedule: mocks.schedule,
}));

import { createReminderTriggerCronRuntime } from './reminder-trigger-cron.runtime';
import { createReminderModule, type ReminderModuleInstance } from '../reminder.module';

const fakeRepository = {
  findByIdForIdentity: vi.fn(),
  save: vi.fn(),
} as never;

const fakeSchedulerService = {
  schedule: vi.fn(async () => ({
    successCount: 0,
    failedCount: 0,
    skippedCount: 0,
    totalCount: 0,
    details: [],
    duration: 0,
  })),
};

function createCronRuntime() {
  return createReminderTriggerCronRuntime({
    reminderTemplateRepository: fakeRepository,
    reminderGroupRepository: fakeRepository,
    schedulerService: fakeSchedulerService,
    drainTimeoutMs: 100,
  });
}

function createModuleWithCron(): ReminderModuleInstance {
  const runtime = createCronRuntime();
  return createReminderModule({
    reminderTemplateRepository: fakeRepository,
    reminderGroupRepository: fakeRepository,
    reminderResponseRepository: fakeRepository,
    userReminderPreferenceRepository: fakeRepository,
    closureChecker: async () => false,
    runtimeContributions: runtime,
  });
}

describe('createReminderTriggerCronRuntime', () => {
  beforeEach(() => {
    mocks.schedule.mockClear();
    mocks.start.mockClear();
    mocks.stop.mockClear();
    mocks.scheduledTasks.length = 0;
  });

  afterEach(() => {
    // Stop any cron task scheduled during a test so no interval keeps the
    // test process alive.
    for (const task of mocks.scheduledTasks) {
      task.stop();
    }
  });

  it('returns a module-owned runtime contribution (start/stop/execute)', () => {
    const runtime = createCronRuntime();
    expect(typeof runtime.start).toBe('function');
    expect(typeof runtime.stop).toBe('function');
    expect(typeof runtime.execute).toBe('function');
  });

  it('start() is idempotent — a second start does not re-schedule the cron', async () => {
    const runtime = createCronRuntime();
    runtime.start();
    runtime.start();

    expect(mocks.schedule).toHaveBeenCalledTimes(1);
    expect(mocks.start).toHaveBeenCalledTimes(1);
  });

  it('stop() is idempotent — a second stop does not re-stop the cron', async () => {
    const runtime = createCronRuntime();
    runtime.start();
    await runtime.stop();
    await runtime.stop();

    expect(mocks.stop).toHaveBeenCalledTimes(1);
  });

  it('starts with the module instance and stops on dispose (merge-base lifecycle)', async () => {
    const instance = createModuleWithCron();
    expect(mocks.schedule).not.toHaveBeenCalled();

    await instance.start();
    expect(mocks.schedule).toHaveBeenCalledTimes(1);
    expect(mocks.start).toHaveBeenCalledTimes(1);

    await instance.dispose();
    expect(mocks.stop).toHaveBeenCalledTimes(1);
  });

  it('dispose before start is a no-op (no cron ever scheduled)', async () => {
    const instance = createModuleWithCron();
    await instance.dispose();
    expect(mocks.schedule).not.toHaveBeenCalled();
  });
});
