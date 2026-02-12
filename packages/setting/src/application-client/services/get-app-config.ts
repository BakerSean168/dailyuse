/**
 * Get App Config
 *
 * 获取应用配置用例
 */

import type { ISettingApiClient } from '@/infrastructure-client/adapters/types';
import type { AppConfigClientDTO } from '@dailyuse/contracts/setting';
import { SettingContainer } from '@/infrastructure-client/setting.container';

/**
 * Get App Config
 */
export class GetAppConfig {
  private static instance: GetAppConfig;

  private constructor(private readonly apiClient: ISettingApiClient) {}

  static createInstance(apiClient?: ISettingApiClient): GetAppConfig {
    const container = SettingContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetAppConfig.instance = new GetAppConfig(client);
    return GetAppConfig.instance;
  }

  static getInstance(): GetAppConfig {
    if (!GetAppConfig.instance) {
      GetAppConfig.instance = GetAppConfig.createInstance();
    }
    return GetAppConfig.instance;
  }

  static resetInstance(): void {
    GetAppConfig.instance = undefined as unknown as GetAppConfig;
  }

  async execute(): Promise<AppConfigClientDTO> {
    return this.apiClient.getAppConfig();
  }
}

export const getAppConfig = (): Promise<AppConfigClientDTO> =>
  GetAppConfig.getInstance().execute();
