import { describe, expect, it } from 'vitest';
import { NotificationChannel, TriggerResult } from '@dailyuse/contracts/reminder';
import { ReminderHistory } from '../reminder-history';
import { ReminderHistoryId } from '../../value-objects/reminder-history-id';

describe('ReminderHistory entity', () => {
  it('creates successful history entries with notification metadata', () => {
    const history = ReminderHistory.create({
      templateId: 'template-1',
      identityId: 'identity-1',
      triggeredAt: 1_000,
      result: TriggerResult.Success,
      notificationSent: true,
      notificationChannels: [NotificationChannel.InApp, NotificationChannel.Push],
    });

    expect(history.templateId).toBe('template-1');
    expect(history.identityId).toBe('identity-1');
    expect(history.triggeredAt).toBe(1_000);
    expect(history.isSuccess).toBe(true);
    expect(history.notificationChannelCount).toBe(2);
    expect(history.toServerDTO().notificationChannels).toEqual([
      NotificationChannel.InApp,
      NotificationChannel.Push,
    ]);
  });

  it('covers failed and skipped result branches plus error helpers', () => {
    const failed = ReminderHistory.create({
      templateId: 'template-2',
      identityId: 'identity-2',
      result: TriggerResult.Failed,
      error: 'boom',
    });
    const skipped = ReminderHistory.create({
      templateId: 'template-3',
      identityId: 'identity-3',
      result: TriggerResult.Skipped,
    });

    expect(failed.isFailed).toBe(true);
    expect(failed.hasError).toBe(true);
    expect(skipped.isSkipped).toBe(true);
  });

  it('returns client DTOs with semantic fields only', () => {
    const withChannels = ReminderHistory.create({
      templateId: 'template-1',
      identityId: 'identity-1',
      result: TriggerResult.Success,
      notificationSent: true,
      notificationChannels: [NotificationChannel.Email, NotificationChannel.Sms],
    });
    const withoutChannels = ReminderHistory.create({
      templateId: 'template-2',
      identityId: 'identity-2',
      result: TriggerResult.Success,
    });

    expect(withChannels.toClientDTO()).toEqual({
      id: withChannels.id,
      templateId: 'template-1',
      triggeredAt: withChannels.triggeredAt,
      result: TriggerResult.Success,
      error: null,
      notificationSent: true,
      notificationChannels: [NotificationChannel.Email, NotificationChannel.Sms],
      version: 1,
      createdAt: withChannels.createdAt,
      updatedAt: withChannels.createdAt,
      deletedAt: null,
    });
    expect(withoutChannels.toClientDTO().notificationChannels).toBeNull();
    expect(withoutChannels.toClientDTO().deletedAt).toBeNull();
  });

  it('loads persisted state and preserves existing dates', () => {
    const loaded = ReminderHistory.load({
      id: ReminderHistoryId.generate(),
      templateId: 'template-9',
      identityId: 'identity-9',
      triggeredAt: 9_000,
      result: TriggerResult.Success,
      error: null,
      notificationSent: false,
      notificationChannels: null,
      createdAt: 9_500,
    });

    expect(loaded.createdAt).toBe(9_500);
    expect(loaded.toClientDTO().createdAt).toBe(9_500);
  });
});
