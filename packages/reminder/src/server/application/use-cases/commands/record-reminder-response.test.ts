import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecordReminderResponseUseCase } from './record-reminder-response.use-case';
import { eventBus } from '@memoflow/utils/domain';

describe('RecordReminderResponseUseCase', () => {
  const repo = {
    save: vi.fn(),
    findByTemplateId: vi.fn(),
    deleteByTemplateId: vi.fn(),
    getResponseStats: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('records a response and emits event', async () => {
    repo.save.mockResolvedValue(undefined);
    const eventSpy = vi.spyOn(eventBus, 'send');
    const useCase = new RecordReminderResponseUseCase(repo);

    const result = await useCase.execute({
      templateId: 'template-1',
      action: 'Dismiss' as any,
      responseTime: 12,
      identityId: 'identity-1',
    });

    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(eventSpy).toHaveBeenCalledWith(
      'reminder:response-recorded',
      expect.objectContaining({
        templateId: 'template-1',
        action: 'Dismiss',
        responseTime: 12,
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.templateId).toBe('template-1');
      expect(result.data.action).toBe('Dismiss');
      expect(result.data.responseTime).toBe(12);
    }
  });

  it('propagates when save fails', async () => {
    repo.save.mockRejectedValue(new Error('db down'));
    const useCase = new RecordReminderResponseUseCase(repo);

    await expect(
      useCase.execute({
        templateId: 'template-1',
        action: 'Snooze' as any,
        identityId: 'identity-1',
      }),
    ).rejects.toThrow('db down');
  });

  it('loads responses by template with custom limit', async () => {
    repo.findByTemplateId.mockResolvedValue([{ id: 'r1' }]);
    const useCase = new RecordReminderResponseUseCase(repo);

    const result = await useCase.getResponsesByTemplate('template-1', 'identity-1', 5);

    expect(repo.findByTemplateId).toHaveBeenCalledWith('template-1', 'identity-1', 5);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([{ id: 'r1' }]);
    }
  });

  it('propagates when loading responses fails', async () => {
    repo.findByTemplateId.mockRejectedValue(new Error('read error'));
    const useCase = new RecordReminderResponseUseCase(repo);

    await expect(useCase.getResponsesByTemplate('template-1', 'identity-1')).rejects.toThrow('read error');
  });

  it('deletes responses by template', async () => {
    repo.deleteByTemplateId.mockResolvedValue(3);
    const useCase = new RecordReminderResponseUseCase(repo);

    const result = await useCase.deleteResponsesByTemplate('template-1', 'identity-1');

    expect(repo.deleteByTemplateId).toHaveBeenCalledWith('template-1', 'identity-1');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBe(3);
    }
  });

  it('propagates when deleting responses fails', async () => {
    repo.deleteByTemplateId.mockRejectedValue(new Error('delete error'));
    const useCase = new RecordReminderResponseUseCase(repo);

    await expect(useCase.deleteResponsesByTemplate('template-1', 'identity-1')).rejects.toThrow('delete error');
  });

  it('returns response stats for a template', async () => {
    repo.getResponseStats.mockResolvedValue({
      total: 10,
      clicked: 4,
      ignored: 2,
      snoozed: 2,
      dismissed: 1,
      completed: 1,
      avgResponseTime: 15,
    });
    const useCase = new RecordReminderResponseUseCase(repo);

    const result = await useCase.getResponseStats('template-1', 'identity-1', 14);

    expect(repo.getResponseStats).toHaveBeenCalledWith('template-1', 'identity-1', 14);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.total).toBe(10);
      expect(result.data.avgResponseTime).toBe(15);
    }
  });

  it('propagates when loading stats fails', async () => {
    repo.getResponseStats.mockRejectedValue(new Error('stats error'));
    const useCase = new RecordReminderResponseUseCase(repo);

    await expect(useCase.getResponseStats('template-1', 'identity-1')).rejects.toThrow('stats error');
  });
});

describe('RecordReminderResponseUseCase R3c (snooze command semantics)', () => {
  const repo = { save: vi.fn(), findByTemplateId: vi.fn(), deleteByTemplateId: vi.fn(), getResponseStats: vi.fn() } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    repo.save.mockResolvedValue(undefined);
  });

  it('rejects snooze without a positive duration', async () => {
    const useCase = new RecordReminderResponseUseCase(repo);
    const result = await useCase.execute({
      templateId: 'template-1',
      action: 'SNOOZED',
      identityId: 'identity-1',
    });
    expect(result.ok).toBe(false);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('calls the snooze rescheduler to defer the next trigger', async () => {
    const rescheduler = { reschedule: vi.fn(async () => undefined) };
    const useCase = new RecordReminderResponseUseCase(repo, rescheduler);

    const result = await useCase.execute({
      templateId: 'template-1',
      action: 'SNOOZED',
      responseTime: 900, // seconds
      identityId: 'identity-1',
    });

    expect(result.ok).toBe(true);
    expect(rescheduler.reschedule).toHaveBeenCalledWith('template-1', 'identity-1', 900);
  });

  it('still records the response when rescheduling fails', async () => {
    const rescheduler = { reschedule: vi.fn(async () => { throw new Error('schedule down'); }) };
    const useCase = new RecordReminderResponseUseCase(repo, rescheduler);

    const result = await useCase.execute({
      templateId: 'template-1',
      action: 'SNOOZED',
      responseTime: 300,
      identityId: 'identity-1',
    });

    expect(result.ok).toBe(true);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('does not reschedule for non-snooze actions', async () => {
    const rescheduler = { reschedule: vi.fn(async () => undefined) };
    const useCase = new RecordReminderResponseUseCase(repo, rescheduler);

    await useCase.execute({
      templateId: 'template-1',
      action: 'COMPLETED',
      responseTime: 10,
      identityId: 'identity-1',
    });

    expect(rescheduler.reschedule).not.toHaveBeenCalled();
  });
});
