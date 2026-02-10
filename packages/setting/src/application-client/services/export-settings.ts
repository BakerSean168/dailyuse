/**
 * Export Settings
 *
 * 导出设置用例
 */

import type { ISettingApiClient } from '@/infrastructure-client';
import { SettingContainer } from '@/infrastructure-client';

/**
 * Export Settings
 */
export class ExportSettings {
  private static instance: ExportSettings;

  private constructor(private readonly apiClient: ISettingApiClient) {}

  static createInstance(apiClient?: ISettingApiClient): ExportSettings {
    const container = SettingContainer.getInstance();
    const client = apiClient || container.getApiClient();
    ExportSettings.instance = new ExportSettings(client);
    return ExportSettings.instance;
  }

  static getInstance(): ExportSettings {
    if (!ExportSettings.instance) {
      ExportSettings.instance = ExportSettings.createInstance();
    }
    return ExportSettings.instance;
  }

  static resetInstance(): void {
    ExportSettings.instance = undefined as unknown as ExportSettings;
  }

  async execute(): Promise<string> {
    return this.apiClient.exportSettings();
  }
}

export const exportSettings = (): Promise<string> =>
  ExportSettings.getInstance().execute();
