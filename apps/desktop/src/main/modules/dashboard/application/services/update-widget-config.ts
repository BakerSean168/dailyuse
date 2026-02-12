import { UpdateWidgetConfig } from '@dailyuse/dashboard/application-server';
import type { WidgetConfigData } from '@dailyuse/contracts/dashboard';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('updateWidgetConfigService');

export async function updateWidgetConfigService(
  accountUuid: string,
  configs: Partial<WidgetConfigData>,
): Promise<WidgetConfigData> {
  logger.debug('Updating widget config', { accountUuid });
  const updateWidgetConfigService = UpdateWidgetConfig.getInstance();
  const result = await updateWidgetConfigService.execute(accountUuid, { configs });
  return result.widgetConfig;
}
