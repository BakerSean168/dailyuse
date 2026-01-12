import { NotificationService } from '@dailyuse/application-server';
import type {
  NotificationPreferenceClientDTO,
  NotificationCategory,
  CategoryPreferenceServerDTO,
  DoNotDisturbConfigServerDTO,
} from '@dailyuse/contracts/notification';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('updatePreferenceService');

export async function updatePreferenceService(
  accountUuid: string,
  updates: Partial<{
    channelPreferences: {
      inApp?: boolean;
      push?: boolean;
      email?: boolean;
      sms?: boolean;
    };
    categoryPreferences: Record<NotificationCategory, Partial<CategoryPreferenceServerDTO>>;
    doNotDisturbConfig: Partial<DoNotDisturbConfigServerDTO>;
  }>,
): Promise<NotificationPreferenceClientDTO> {
  const service = NotificationService.getInstance();
  return service.updatePreference(accountUuid, updates);
}
