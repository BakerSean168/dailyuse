import { parseJsonSafe } from '@memoflow/utils/shared';
import type { NotificationChannelType } from '@memoflow/contracts/notification';
import type { DoNotDisturbConfigDTO, RateLimitDTO } from '@memoflow/contracts/notification';
import { NotificationPreference } from '../../../../domain/aggregates/notification-preference';
import { DoNotDisturbConfig } from '../../../../domain/value-objects/do-not-disturb-config';
import { RateLimit } from '../../../../domain/value-objects/rate-limit';

export type PrismaNotificationPreferenceRow = {
  id: string;
  identityId: string;
  globalChannels: string;
  workflowOverrides: string;
  doNotDisturb: string | null;
  rateLimit: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type NotificationPreferenceRowLike = PrismaNotificationPreferenceRow;

export class NotificationPreferencePrismaMapper {
  static toDomain(row: NotificationPreferenceRowLike): NotificationPreference {
    const globalChannels = parseJsonSafe<Record<NotificationChannelType, boolean>>(
      row.globalChannels,
    ) ?? {} as Record<NotificationChannelType, boolean>;
    const workflowOverrides = parseJsonSafe<
      Record<string, Partial<Record<NotificationChannelType, boolean>>>
    >(row.workflowOverrides) ?? {};

    return NotificationPreference.load({
      id: row.id as never,
      identityId: row.identityId as never,
      globalChannels: new Map(Object.entries(globalChannels) as [NotificationChannelType, boolean][]),
      workflowOverrides: new Map(
        Object.entries(workflowOverrides).map(([workflowKey, channels]) => [
          workflowKey,
          new Map(Object.entries(channels) as [NotificationChannelType, boolean][]),
        ]),
      ),
      doNotDisturb: (() => {
        const dto = parseJsonSafe<DoNotDisturbConfigDTO>(row.doNotDisturb);
        return dto ? DoNotDisturbConfig.fromDTO(dto) : null;
      })(),
      rateLimit: (() => {
        const dto = parseJsonSafe<RateLimitDTO>(row.rateLimit);
        return dto ? RateLimit.fromDTO(dto) : null;
      })(),
      version: row.version,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(preference: NotificationPreference) {
    const dto = preference.toServerDTO();
    return {
      dto,
      globalChannels: JSON.stringify(dto.globalChannels),
      workflowOverrides: JSON.stringify(dto.workflowOverrides),
      doNotDisturb: dto.doNotDisturb ? JSON.stringify(dto.doNotDisturb) : null,
      rateLimit: dto.rateLimit ? JSON.stringify(dto.rateLimit) : null,
    };
  }
}
