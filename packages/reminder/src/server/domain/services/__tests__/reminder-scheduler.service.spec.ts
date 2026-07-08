import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TriggerResult } from '@dailyuse/contracts/reminder';
import { ReminderSchedulerService } from '../reminder-scheduler-service';

function createStubTemplate(id: string, title: string, nextTriggerAt: number | null) {
  return {
    id,
    title,
    getNextTriggerTime: vi.fn().mockReturnValue(nextTriggerAt),
    calculateNextTrigger: vi.fn().mockReturnValue(nextTriggerAt === null ? null : nextTriggerAt + 1_000),
  } as any;
}

describe('ReminderSchedulerService', () => {
  const templateRepository = {
    findByIdentityId: vi.fn(),
    findByNextTriggerBefore: vi.fn(),
    save: vi.fn(),
  } as any;
  const triggerService = {
    getPendingReminders: vi.fn(),
    triggerRemindersBatch: vi.fn(),
    recordTriggerSkipped: vi.fn(),
  } as any;

  let service: ReminderSchedulerService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ReminderSchedulerService(templateRepository, triggerService);
  });

  it('returns an empty result when no pending reminders are found', async () => {
    triggerService.getPendingReminders.mockResolvedValue([]);

    const result = await service.schedule({ beforeTime: 100, identityId: 'identity-1' });

    expect(result).toEqual({
      successCount: 0,
      failedCount: 0,
      skippedCount: 0,
      totalCount: 0,
      details: [],
      duration: expect.any(Number),
    });
  });

  it('chunks scheduling work by concurrency and counts outcomes', async () => {
    const templates = [
      createStubTemplate('1', 'one', 1),
      createStubTemplate('2', 'two', 2),
      createStubTemplate('3', 'three', 3),
      createStubTemplate('4', 'four', 4),
      createStubTemplate('5', 'five', 5),
    ];

    triggerService.getPendingReminders.mockResolvedValue(templates);
    triggerService.triggerRemindersBatch
      .mockResolvedValueOnce([
        { ok: true, result: TriggerResult.Success, triggerTime: 1, nextTriggerTime: 2, message: 'ok' },
        { ok: false, result: TriggerResult.Failed, triggerTime: 1, nextTriggerTime: null, message: 'fail' },
      ])
      .mockResolvedValueOnce([
        { ok: false, result: TriggerResult.Skipped, triggerTime: 1, nextTriggerTime: 2, message: 'skip' },
        { ok: true, result: TriggerResult.Success, triggerTime: 1, nextTriggerTime: 2, message: 'ok' },
      ]);

    const result = await service.schedule({ beforeTime: 200, maxCount: 4, concurrency: 2 });

    expect(triggerService.getPendingReminders).toHaveBeenCalledWith(200, undefined);
    expect(triggerService.triggerRemindersBatch).toHaveBeenCalledTimes(2);
    expect(result.successCount).toBe(2);
    expect(result.failedCount).toBe(1);
    expect(result.skippedCount).toBe(1);
    expect(result.totalCount).toBe(4);
  });

  it('recalculates next trigger times and saves only changed templates', async () => {
    const changed = {
      getNextTriggerTime: vi.fn().mockReturnValue(100),
      calculateNextTrigger: vi.fn().mockReturnValue(200),
    };
    const unchanged = {
      getNextTriggerTime: vi.fn().mockReturnValue(300),
      calculateNextTrigger: vi.fn().mockReturnValue(300),
    };

    templateRepository.findByIdentityId.mockResolvedValue([changed, unchanged]);

    const updatedCount = await service.recalculateAllNextTriggerTimes('identity-1');

    expect(updatedCount).toBe(1);
    expect(templateRepository.save).toHaveBeenCalledTimes(1);
    expect(templateRepository.save).toHaveBeenCalledWith(changed);
  });

  it('filters upcoming reminders to future timestamps only', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-27T10:00:00.000Z'));
    const future = createStubTemplate('future', 'future', Date.now() + 10 * 60_000);
    const overdue = createStubTemplate('overdue', 'overdue', Date.now() - 10 * 60_000);
    const missing = createStubTemplate('missing', 'missing', null);
    templateRepository.findByNextTriggerBefore.mockResolvedValue([future, overdue, missing]);

    const result = await service.getUpcomingReminders('identity-1', 30);

    expect(result).toEqual([future]);
    vi.useRealTimers();
  });

  it('handles overdue reminders with skip, trigger, and reschedule actions', async () => {
    const overdueA = createStubTemplate('a', 'A', 100);
    const overdueB = createStubTemplate('b', 'B', 200);

    vi.spyOn(service, 'getOverdueReminders').mockResolvedValue([overdueA, overdueB]);
    triggerService.triggerRemindersBatch.mockResolvedValue([
      { ok: true, result: TriggerResult.Success, triggerTime: 1, nextTriggerTime: 2, message: 'ok' },
      { ok: true, result: TriggerResult.Success, triggerTime: 1, nextTriggerTime: 2, message: 'ok' },
    ]);

    const skipped = await service.handleOverdueReminders('identity-1', 'skip');
    const triggered = await service.handleOverdueReminders('identity-1', 'trigger');
    const rescheduled = await service.handleOverdueReminders('identity-1', 'reschedule');

    expect(triggerService.recordTriggerSkipped).toHaveBeenCalledTimes(2);
    expect(skipped.skippedCount).toBe(2);
    expect(triggered.successCount).toBe(2);
    expect(triggerService.triggerRemindersBatch).toHaveBeenCalledWith([
      { template: overdueA, reason: '过期补触发' },
      { template: overdueB, reason: '过期补触发' },
    ]);
    expect(rescheduled.skippedCount).toBe(2);
    expect(templateRepository.save).toHaveBeenCalled();
  });
});
