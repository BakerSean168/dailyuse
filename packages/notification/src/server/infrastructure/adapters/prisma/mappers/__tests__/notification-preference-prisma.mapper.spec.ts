import { describe, expect, it } from 'vitest';
import { NotificationChannelType } from '@memoflow/contracts/notification';
import { NotificationPreference } from '../../../../../domain/aggregates/notification-preference';
import { DoNotDisturbConfig } from '../../../../../domain/value-objects/do-not-disturb-config';
import { RateLimit } from '../../../../../domain/value-objects/rate-limit';
import { NotificationPreferencePrismaMapper } from '../notification-preference-prisma.mapper';

describe('NotificationPreferencePrismaMapper policy fields', () => {
  it('round-trips DND and rate-limit configuration through existing persistence columns', () => {
    const preference = NotificationPreference.create({
      identityId: 'identity-policy-roundtrip',
      defaultChannels: [NotificationChannelType.InApp],
    });
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
      enabled: persisted.enabled,
      channels: persisted.channels,
      categories: persisted.categories,
      doNotDisturb: persisted.doNotDisturb,
      rateLimit: persisted.rateLimit,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: null,
    });

    expect(loaded.doNotDisturb?.toDTO()).toEqual(preference.doNotDisturb?.toDTO());
    expect(loaded.rateLimit?.toDTO()).toEqual(preference.rateLimit?.toDTO());
  });
});
