import { NotificationService } from '@dailyuse/application-server';
import type { NotificationPreferenceClientDTO } from '@dailyuse/contracts/notification';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getOrCreatePreferenceService');

export async function getOrCreatePreferenceService(
  accountUuid: string,
): Promise<NotificationPreferenceClientDTO> {
  return NotificationService.getInstance().getOrCreatePreference(accountUuid);
}
