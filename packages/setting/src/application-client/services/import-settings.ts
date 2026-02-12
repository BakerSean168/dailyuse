/**
 * Import Settings
 *
 * 导入设置用例
 */

import type { ISettingApiClient } from '@/infrastructure-client/adapters/types';
import type { UserSettingClientDTO } from '@dailyuse/contracts/setting';
import { SettingContainer } from '@/infrastructure-client/setting.container';

/**
 * Import Settings
 */
export class ImportSettings {
  private static instance: ImportSettings;

  private constructor(private readonly apiClient: ISettingApiClient) {}

  static createInstance(apiClient?: ISettingApiClient): ImportSettings {
    const container = SettingContainer.getInstance();
    const client = apiClient || container.getApiClient();
    ImportSettings.instance = new ImportSettings(client);
    return ImportSettings.instance;
  }

  static getInstance(): ImportSettings {
    if (!ImportSettings.instance) {
      ImportSettings.instance = ImportSettings.createInstance();
    }
    return ImportSettings.instance;
  }

  static resetInstance(): void {
    ImportSettings.instance = undefined as unknown as ImportSettings;
  }

  async execute(data: string): Promise<UserSettingClientDTO> {
    return this.apiClient.importSettings(data);
  }
}

export const importSettings = (data: string): Promise<UserSettingClientDTO> =>
  ImportSettings.getInstance().execute(data);
