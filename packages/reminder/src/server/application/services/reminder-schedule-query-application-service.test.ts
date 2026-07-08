import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { ReminderTemplateServerDTO } from '@dailyuse/contracts/reminder';
import {
  NotificationChannel,
  ReminderStatus,
  ReminderType,
  TriggerType,
} from '@dailyuse/contracts/reminder';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import type { IReminderTemplateRepository } from '../../domain/repositories/i-reminder-template-repository';
import { ReminderScheduleQueryApplicationService } from './reminder-schedule-query-application-service';

const IDENTITY_ID = 'IdentityId_550e8400-e29b-41d4-a716-446655440001';

function createReminder(overrides: Partial<ReminderTemplateServerDTO>): ReminderTemplateServerDTO {
  const now = Date.parse('2026-03-29T00:00:00.000Z');

  return {
    id: 'reminder-template-id' as ReminderTemplateServerDTO['id'],
    identityId: IDENTITY_ID as ReminderTemplateServerDTO['identityId'],
    name: '提醒',
    description: null,
    type: ReminderType.Recurring,
    trigger: {
      type: TriggerType.FixedTime,
      fixedTime: { time: '09:00', timezone: null },
      interval: null,
    },
    activeTime: {
      activatedAt: now,
    },
    activeHours: null,
    notificationConfig: {
      channels: [NotificationChannel.InApp],
      title: null,
      body: null,
      sound: null,
      vibration: null,
      actions: null,
    },
    selfEnabled: true,
    status: ReminderStatus.Active,
    groupId: null,
    importanceLevel: ImportanceLevel.Moderate,
    tags: [],
    color: '#16A34A',
    icon: 'figure-walking',
    nextTriggerAt: now + 60 * 60 * 1000,
    version: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

describe('ReminderScheduleQueryApplicationService', () => {
  let reminderTemplateRepository: ReturnType<typeof createMockRepo<IReminderTemplateRepository>>;
  let service: ReminderScheduleQueryApplicationService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-29T00:00:00.000Z'));

    reminderTemplateRepository = createMockRepo<IReminderTemplateRepository>({
      findByIdentityId: vi.fn().mockResolvedValue([]),
    });
    service = new ReminderScheduleQueryApplicationService({
      reminderTemplateRepository,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('filters upcoming reminders before calculation and respects limit', async () => {
    const recurring = {
      toServerDTO: vi.fn().mockReturnValue(
        createReminder({
          id: 'recurring-1' as ReminderTemplateServerDTO['id'],
          name: 'Recurring',
          nextTriggerAt: Date.parse('2026-03-29T01:00:00.000Z'),
        }),
      ),
    };
    const otherRecurring = {
      toServerDTO: vi.fn().mockReturnValue(
        createReminder({
          id: 'recurring-2' as ReminderTemplateServerDTO['id'],
          name: 'Recurring Later',
          nextTriggerAt: Date.parse('2026-03-29T02:00:00.000Z'),
        }),
      ),
    };
    const oneTime = {
      toServerDTO: vi.fn().mockReturnValue(
        createReminder({
          id: 'one-time-1' as ReminderTemplateServerDTO['id'],
          name: 'One Time',
          type: ReminderType.OneTime,
          nextTriggerAt: Date.parse('2026-03-29T00:30:00.000Z'),
        }),
      ),
    };
    (reminderTemplateRepository.findByIdentityId as ReturnType<typeof vi.fn>).mockResolvedValue([
      recurring,
      otherRecurring,
      oneTime,
    ]);

    const result = await service.getUpcomingReminders(
      { type: ReminderType.Recurring, limit: 1 },
      { identityId: IDENTITY_ID },
    );

    expect(result).toEqual({
      ok: true,
      data: {
        data: [
          expect.objectContaining({
            templateId: 'recurring-1',
            title: 'Recurring',
          }),
        ],
        total: 2,
      },
    });
  });
});