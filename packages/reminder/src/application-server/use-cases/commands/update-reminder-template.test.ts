import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateReminderTemplate } from './update-reminder-template';
import { ControlMode, ReminderStatus } from '@dailyuse/contracts/reminder';

describe('UpdateReminderTemplate', () => {
  const templateRepository = {
    findById: vi.fn(),
    save: vi.fn(),
  } as any;

  const groupRepository = {
    findById: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when template does not exist', async () => {
    templateRepository.findById.mockResolvedValue(null);
    const useCase = new UpdateReminderTemplate(templateRepository, groupRepository);

    await expect(useCase.execute('tpl-1', {} as any)).rejects.toThrow(
      'Reminder Template tpl-1 not found',
    );
  });

  it('throws when group id is provided but group not found', async () => {
    templateRepository.findById.mockResolvedValue({
      identityId: 'identity-1',
      update: vi.fn(),
      setEffectiveEnabled: vi.fn(),
      toClientDTO: vi.fn().mockReturnValue({ id: 'tpl-1' }),
    });
    groupRepository.findById.mockResolvedValue(null);
    const useCase = new UpdateReminderTemplate(templateRepository, groupRepository);

    await expect(
      useCase.execute('tpl-1', {
        groupId: 'group-1',
      } as any),
    ).rejects.toThrow('Invalid groupId: group-1');
  });

  it('updates template without group reassignment', async () => {
    const update = vi.fn();
    const setEffectiveEnabled = vi.fn();
    const toClientDTO = vi.fn().mockReturnValue({ id: 'tpl-1', name: 'updated' });

    templateRepository.findById.mockResolvedValue({
      identityId: 'identity-1',
      status: ReminderStatus.Active,
      update,
      setEffectiveEnabled,
      toClientDTO,
    });
    templateRepository.save.mockResolvedValue(undefined);
    const useCase = new UpdateReminderTemplate(templateRepository, groupRepository);

    const result = await useCase.execute('tpl-1', {
      title: 'updated',
      activeTime: { startDate: new Date('2026-04-01T00:00:00.000Z').toISOString() },
      notificationConfig: {
        channels: ['Push'],
        title: null,
        body: null,
        sound: { enabled: true, soundName: null },
        vibration: { enabled: true, pattern: null },
      },
    } as any);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'updated',
        activeTime: {
          activatedAt: new Date('2026-04-01T00:00:00.000Z').toISOString(),
        },
        notificationConfig: expect.objectContaining({
          actions: null,
        }),
      }),
    );
    expect(setEffectiveEnabled).not.toHaveBeenCalled();
    expect(templateRepository.save).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: 'tpl-1', name: 'updated' });
  });

  it('recalculates effective enabled when group reassigned', async () => {
    const update = vi.fn();
    const setEffectiveEnabled = vi.fn();

    templateRepository.findById.mockResolvedValue({
      identityId: 'identity-1',
      status: ReminderStatus.Active,
      update,
      setEffectiveEnabled,
      toClientDTO: vi.fn().mockReturnValue({ id: 'tpl-1' }),
    });

    groupRepository.findById.mockResolvedValue({
      id: 'group-1',
      identityId: 'identity-1',
      controlMode: ControlMode.Individual,
      status: ReminderStatus.Active,
    });

    const useCase = new UpdateReminderTemplate(templateRepository, groupRepository);
    await useCase.execute('tpl-1', { groupId: 'group-1' } as any);

    expect(groupRepository.findById).toHaveBeenCalledWith('group-1');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        groupId: 'group-1',
      }),
    );
    expect(setEffectiveEnabled).toHaveBeenCalledWith(true);
  });
});
