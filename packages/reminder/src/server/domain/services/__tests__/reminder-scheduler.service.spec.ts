import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TriggerResult } from '@memoflow/contracts/reminder';
import { ReminderSchedulerService } from '../reminder-scheduler-service';
import { ReminderMetricsCollector } from '../reminder-metrics-service';

function createStubTemplate(id: string, title: string, nextTriggerAt: number | null) {
  return {
    id,
    title,
    identityId: 'user-1',
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

  const reliablePort = {
    claimOccurrence: vi.fn(),
    heartbeatLease: vi.fn(),
    recordDeliveryIntent: vi.fn(),
  } as any;

  const transactionRunner = {
    executeClaimedOccurrenceTransaction: vi.fn(),
  } as any;

  const controlService = {
    isTemplateEffectivelyEnabled: vi.fn().mockResolvedValue(true),
  } as any;

  let metricsCollector: ReminderMetricsCollector;
  let service: ReminderSchedulerService;

  beforeEach(() => {
    vi.clearAllMocks();
    metricsCollector = new ReminderMetricsCollector();
    service = new ReminderSchedulerService(
      templateRepository,
      triggerService,
      reliablePort,
      transactionRunner,
      controlService,
      metricsCollector,
    );
  });

  it('fails fast on missing mandatory reliable dependencies', () => {
    expect(
      () =>
        new ReminderSchedulerService(
          templateRepository,
          triggerService,
          null as any,
          null as any,
          null as any,
        ),
    ).toThrow('[REMINDER_SCHEDULER] Mandatory dependencies missing');
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

  it('chunks scheduling work by concurrency and processes through reliable path', async () => {
    const templates = [
      createStubTemplate('1', 'one', 1),
      createStubTemplate('2', 'two', 2),
      createStubTemplate('3', 'three', 3),
      createStubTemplate('4', 'four', 4),
    ];

    triggerService.getPendingReminders.mockResolvedValue(templates);

    reliablePort.claimOccurrence.mockImplementation(({ templateId }: any) => ({
      claimed: true,
      lease: { fencingToken: 1, claimId: `claim-${templateId}`, ownerToken: 'owner-1' },
      receipt: { operationId: `op-${templateId}`, status: 'running', attempt: 1 },
    }));

    transactionRunner.executeClaimedOccurrenceTransaction
      .mockResolvedValueOnce({ status: 'succeeded', operationId: 'op-1' })
      .mockRejectedValueOnce(new Error('Trigger error'))
      .mockResolvedValueOnce({ status: 'skipped', operationId: 'op-3' })
      .mockResolvedValueOnce({ status: 'succeeded', operationId: 'op-4' });

    const result = await service.schedule({ beforeTime: 200, maxCount: 4, concurrency: 2 });

    expect(triggerService.getPendingReminders).toHaveBeenCalledWith(200, undefined);
    expect(reliablePort.claimOccurrence).toHaveBeenCalledTimes(4);
    expect(transactionRunner.executeClaimedOccurrenceTransaction).toHaveBeenCalledTimes(4);
    expect(result.successCount).toBe(2);
    expect(result.failedCount).toBe(1);
    expect(result.skippedCount).toBe(1);
    expect(result.totalCount).toBe(4);
  });

  it('correctly transitions status from retryable to dead_letter upon max retries with metrics calls', async () => {
    const sampleReceipt = {
      schemaVersion: 1,
      operationId: 'op-fail',
      identityId: 'user-1',
      source: 'reminder',
      occurrenceKey: '2026-08-09T10:00:00.000Z',
      idempotencyKey: 'rem:user-1:2026-08-09T10:00:00.000Z',
      status: 'running',
      attempt: 1,
      lease: null,
      lastError: null,
      nextRetryAt: null,
      deadLetterAt: null,
      correlationId: null,
      causationId: null,
      attemptsHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      finishedAt: null,
    } as any;

    // Attempt 1 -> retryable
    await service.recordOccurrenceFailure({
      receipt: { ...sampleReceipt, attempt: 1 },
      error: new Error('Network timeout'),
      maxRetries: 3,
    });

    let snapshot = metricsCollector.getSnapshot();
    // W7 互斥语义：retryable 分支只累计 retried，不得累计终态 failed
    expect(snapshot.failedTotal).toBe(0);
    expect(snapshot.retryTotal).toBe(1);
    expect(snapshot.deadLetterTotal).toBe(0);
    const unified1 = metricsCollector.getUnifiedSnapshot();
    expect(unified1['memoflow.reminder.outbox.retried']).toBe(1);
    expect(unified1['memoflow.reminder.outbox.failed']).toBeUndefined();

    expect(reliablePort.recordDeliveryIntent).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: 'retryable',
        nextRetryAt: expect.any(String),
        deadLetterAt: null,
      }),
    );

    // Attempt 3 -> dead_letter
    await service.recordOccurrenceFailure({
      receipt: { ...sampleReceipt, attempt: 3 },
      error: new Error('Persistent failure'),
      maxRetries: 3,
    });

    snapshot = metricsCollector.getSnapshot();
    // W7 互斥语义：dead_letter 分支只累计 dead_letter，不得再累计终态 failed
    expect(snapshot.failedTotal).toBe(0);
    expect(snapshot.retryTotal).toBe(1);
    expect(snapshot.deadLetterTotal).toBe(1);
    const unified2 = metricsCollector.getUnifiedSnapshot();
    expect(unified2['memoflow.reminder.outbox.retried']).toBe(1);
    expect(unified2['memoflow.reminder.outbox.dead_letter']).toBe(1);
    expect(unified2['memoflow.reminder.outbox.failed']).toBeUndefined();

    expect(reliablePort.recordDeliveryIntent).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: 'dead_letter',
        nextRetryAt: null,
        deadLetterAt: expect.any(String),
      }),
    );
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
