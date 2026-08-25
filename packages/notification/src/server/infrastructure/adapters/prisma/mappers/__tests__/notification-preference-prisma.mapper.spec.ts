import { describe, expect, it } from 'vitest';
import { NotificationChannelType } from '@memoflow/contracts/notification';
import { NotificationPreference } from '../../../../../domain/aggregates/notification-preference';
import { DoNotDisturbConfig } from '../../../../../domain/value-objects/do-not-disturb-config';
import { RateLimit } from '../../../../../domain/value-objects/rate-limit';
import { NotificationPreferencePrismaMapper } from '../notification-preference-prisma.mapper';

describe('NotificationPreferencePrismaMapper vNext hierarchy', () => {
  it('round-trips global/workflow preference layers plus DND/rate-limit', () => {
    const preference = NotificationPreference.create({
      identityId: 'identity-policy-roundtrip' as never,
    });
    preference.setGlobalChannel(NotificationChannelType.Email, false);
    preference.setWorkflowChannelOverride(
      'system.weekly-digest',
      NotificationChannelType.Email,
      true,
    );
    preference.setDoNotDisturb(
      DoNotDisturbConfig.create({
        enabled: true,
        startTime: '22:30',
        endTime: '07:45',
        daysOfWeek: [1, 2, 3, 4, 5],
      }),
    );
    preference.setRateLimit(
      RateLimit.create({ enabled: true, maxPerHour: 4, maxPerDay: 20 }),
    );

    const persisted = NotificationPreferencePrismaMapper.toPersistence(preference);
    const dto = persisted.dto;
    const loaded = NotificationPreferencePrismaMapper.toDomain({
      id: String(dto.id),
      identityId: String(dto.identityId),
      globalChannels: persisted.globalChannels,
      workflowOverrides: persisted.workflowOverrides,
      doNotDisturb: persisted.doNotDisturb,
      rateLimit: persisted.rateLimit,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: null,
    });

    expect(loaded.getGlobalChannel(NotificationChannelType.Email)).toBe(false);
    expect(
      loaded.getWorkflowChannelOverride('system.weekly-digest', NotificationChannelType.Email),
    ).toBe(true);
    expect(loaded.doNotDisturb?.toDTO()).toEqual(preference.doNotDisturb?.toDTO());
    expect(loaded.rateLimit?.toDTO()).toEqual(preference.rateLimit?.toDTO());
    expect(persisted).not.toHaveProperty('channels');
    expect(persisted).not.toHaveProperty('categories');
    expect(persisted).not.toHaveProperty('enabled');
  });
});
