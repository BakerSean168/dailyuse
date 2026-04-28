import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdjustReminderFrequency } from './adjust-reminder-frequency';
import { eventBus } from '@dailyuse/utils';

describe('AdjustReminderFrequency', () => {
  const repo = {
    findById: vi.fn(),
    save: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when template is not found', async () => {
    repo.findById.mockResolvedValue(null);
    const useCase = new AdjustReminderFrequency(repo);

    await expect(
      useCase.execute({
        templateId: 'tpl-1',
        newInterval: 30,
        reason: 'manual tune',
        identityId: 'identity-1',
      }),
    ).rejects.toThrow('Template tpl-1 not found');
  });

  it('throws when template trigger is not interval-based', async () => {
    repo.findById.mockResolvedValue({
      trigger: {
        type: 'EventBased',
        fixedTime: null,
        interval: null,
      },
      update: vi.fn(),
    });
    const useCase = new AdjustReminderFrequency(repo);

    await expect(
      useCase.execute({
        templateId: 'tpl-1',
        newInterval: 45,
        reason: 'manual tune',
        identityId: 'identity-1',
      }),
    ).rejects.toThrow('Template tpl-1 does not use interval trigger');
  });

  it('updates interval and persists template', async () => {
    const update = vi.fn();
    const template = {
      trigger: {
        type: 'Interval',
        fixedTime: null,
        interval: {
          minutes: 60,
        },
      },
      update,
    };
    repo.findById.mockResolvedValue(template);
    repo.save.mockResolvedValue(undefined);
    const eventSpy = vi.spyOn(eventBus, 'send');
    const useCase = new AdjustReminderFrequency(repo);

    const result = await useCase.execute({
      templateId: 'tpl-1',
      newInterval: 30,
      reason: 'engagement drop',
      identityId: 'identity-1',
    });

    expect(update).toHaveBeenCalledWith({
      trigger: {
        type: 'Interval',
        fixedTime: null,
        interval: {
          minutes: 30,
        },
      },
    });
    expect(repo.save).toHaveBeenCalledWith(template);
    expect(eventSpy).toHaveBeenCalledWith(
      'reminder:frequency:adjusted',
      expect.objectContaining({
        templateId: 'tpl-1',
        originalInterval: 60,
        adjustedInterval: 30,
        reason: 'engagement drop',
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        templateId: 'tpl-1',
        success: true,
        originalInterval: 60,
        adjustedInterval: 30,
      }),
    );
  });

  it('reject throws when template is not found', async () => {
    repo.findById.mockResolvedValue(null);
    const useCase = new AdjustReminderFrequency(repo);

    await expect(useCase.reject('tpl-1', 'identity-1')).rejects.toThrow(
      'Template tpl-1 not found',
    );
  });

  it('reject emits adjustment-rejected event', async () => {
    repo.findById.mockResolvedValue({ id: 'tpl-1' });
    const eventSpy = vi.spyOn(eventBus, 'send');
    const useCase = new AdjustReminderFrequency(repo);

    await useCase.reject('tpl-1', 'identity-1');

    expect(eventSpy).toHaveBeenCalledWith(
      'reminder:frequency:adjustment-rejected',
      expect.objectContaining({
        templateId: 'tpl-1',
        identityId: 'identity-1',
      }),
    );
  });
});
