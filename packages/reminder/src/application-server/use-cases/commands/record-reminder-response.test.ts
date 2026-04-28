import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecordReminderResponse } from './record-reminder-response';
import { eventBus } from '@dailyuse/utils';

describe('RecordReminderResponse', () => {
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
    const useCase = new RecordReminderResponse(repo);

    const result = await useCase.execute({
      templateId: 'template-1',
      action: 'Dismiss' as any,
      responseTime: 12,
      identityId: 'identity-1',
    });

    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(eventSpy).toHaveBeenCalledWith(
      'reminder:response:recorded',
      expect.objectContaining({
        templateId: 'template-1',
        action: 'Dismiss',
        responseTime: 12,
      }),
    );
    expect(result.templateId).toBe('template-1');
    expect(result.action).toBe('Dismiss');
    expect(result.responseTime).toBe(12);
  });

  it('rethrows when save fails', async () => {
    repo.save.mockRejectedValue(new Error('db down'));
    const useCase = new RecordReminderResponse(repo);

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
    const useCase = new RecordReminderResponse(repo);

    const result = await useCase.getResponsesByTemplate('template-1', 5);

    expect(repo.findByTemplateId).toHaveBeenCalledWith('template-1', 5);
    expect(result).toEqual([{ id: 'r1' }]);
  });

  it('rethrows when loading responses fails', async () => {
    repo.findByTemplateId.mockRejectedValue(new Error('read error'));
    const useCase = new RecordReminderResponse(repo);

    await expect(useCase.getResponsesByTemplate('template-1')).rejects.toThrow('read error');
  });

  it('deletes responses by template', async () => {
    repo.deleteByTemplateId.mockResolvedValue(3);
    const useCase = new RecordReminderResponse(repo);

    const count = await useCase.deleteResponsesByTemplate('template-1');

    expect(repo.deleteByTemplateId).toHaveBeenCalledWith('template-1');
    expect(count).toBe(3);
  });

  it('rethrows when deleting responses fails', async () => {
    repo.deleteByTemplateId.mockRejectedValue(new Error('delete error'));
    const useCase = new RecordReminderResponse(repo);

    await expect(useCase.deleteResponsesByTemplate('template-1')).rejects.toThrow('delete error');
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
    const useCase = new RecordReminderResponse(repo);

    const stats = await useCase.getResponseStats('template-1', 14);

    expect(repo.getResponseStats).toHaveBeenCalledWith('template-1', 14);
    expect(stats.total).toBe(10);
    expect(stats.avgResponseTime).toBe(15);
  });

  it('rethrows when loading stats fails', async () => {
    repo.getResponseStats.mockRejectedValue(new Error('stats error'));
    const useCase = new RecordReminderResponse(repo);

    await expect(useCase.getResponseStats('template-1')).rejects.toThrow('stats error');
  });
});
