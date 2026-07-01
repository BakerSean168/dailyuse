import { NotificationChannelType } from '@dailyuse/contracts/notification';
import type {
  NotificationPreferenceClientDTO,
  UpdateNotificationPreferenceReq,
} from '@dailyuse/contracts/notification';
import type { Result } from '@dailyuse/contracts/result';
import { error, ok } from '@dailyuse/contracts/result';
import type { INotificationPreferenceRepository } from '../../../domain-server/repositories';
import { toNotificationPreferenceClientDTO } from './notification-dto-converters';

type UpdateNotificationPreferenceInput = UpdateNotificationPreferenceReq & {
  identityId?: string;
};

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

  async execute(
    input: UpdateNotificationPreferenceInput,
  ): Promise<Result<NotificationPreferenceClientDTO>> {
    if (!input.identityId) {
      return error('BAD_REQUEST', 'identityId is required');
    }

    const preference = await this.preferenceRepository.getOrCreate(input.identityId);
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
