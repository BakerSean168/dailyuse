import { GetWidgetConfig } from '@dailyuse/application-server';
import type { WidgetConfigData } from '@dailyuse/contracts/dashboard';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getWidgetConfigService');

export async function getWidgetConfigService(accountUuid: string): Promise<WidgetConfigData> {
  logger.debug('Getting widget config', { accountUuid });
  const getWidgetConfigService = GetWidgetConfig.getInstance();
  const result = await getWidgetConfigService.execute(accountUuid);
  return result.widgetConfig;
}
