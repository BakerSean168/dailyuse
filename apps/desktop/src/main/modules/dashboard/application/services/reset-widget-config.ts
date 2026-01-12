import { ResetWidgetConfig } from '@dailyuse/application-server';
import type { WidgetConfigData } from '@dailyuse/contracts/dashboard';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('resetWidgetConfigService');

export async function resetWidgetConfigService(accountUuid: string): Promise<WidgetConfigData> {
  logger.debug('Resetting widget config', { accountUuid });
  const resetWidgetConfigService = ResetWidgetConfig.getInstance();
  const result = await resetWidgetConfigService.execute(accountUuid);
  return result.widgetConfig;
}
