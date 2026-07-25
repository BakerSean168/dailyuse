import { NotificationChannelType } from '@dailyuse/contracts/notification';
import type {
  NotificationPreferenceClientDTO,
  UpdateNotificationPreferenceReq,
} from '@dailyuse/contracts/notification';
import type { Result } from '@dailyuse/contracts/result';
import { error, ok } from '@dailyuse/contracts/result';
import type { INotificationPreferenceRepository } from '../../../domain/repositories';
import { toNotificationPreferenceClientDTO } from './notification-dto-converters';

const CHANNEL_MAP = {
  inApp: NotificationChannelType.InApp,
  email: NotificationChannelType.Email,
  push: NotificationChannelType.Push,
  sms: NotificationChannelType.Sms,
} as const;

const DEFAULT_MODULES = ['task', 'goal', 'schedule', 'reminder', 'account', 'system'] as const;

function toEnabledChannels(value: Record<string, unknown> | undefined) {
  if (!value) {
    return [];
  }

  return Object.entries(CHANNEL_MAP)
    .filter(([key]) => Boolean(value[key]))
    .map(([, channel]) => channel);
}

function asChannelFlags(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

export class UpdateNotificationPreferenceUseCase {
  constructor(private readonly preferenceRepository: INotificationPreferenceRepository) {}

  /**
   * identityId is required at the call boundary (residual 194) — never optional dual-track.
   */
  async execute(
    identityId: string,
    input: UpdateNotificationPreferenceReq,
  ): Promise<Result<NotificationPreferenceClientDTO>> {
    if (!identityId) {
      return error('BAD_REQUEST', 'identityId is required');
    }

    const preference = await this.preferenceRepository.getOrCreate(identityId);
    const disabled = input.enabled === false;
    const categories = input.categories ?? {};
    const categoryEntries = Object.entries(categories);

    for (const [moduleName, value] of categoryEntries) {
      preference.setModuleChannels(
        moduleName,
        disabled ? [] : toEnabledChannels(asChannelFlags(value)),
      );
    }

    if (input.channels && categoryEntries.length === 0) {
      const fallbackChannels = toEnabledChannels(input.channels);
      for (const moduleName of DEFAULT_MODULES) {
        preference.setModuleChannels(moduleName, disabled ? [] : fallbackChannels);
      }
    }

    await this.preferenceRepository.save(preference);

    return ok(toNotificationPreferenceClientDTO(preference.toServerDTO()));
  }
}
