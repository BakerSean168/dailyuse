/**
 * Setting Application Service
 * @module application-client/setting
 */
import { GetSettings, UpdateSettings, ResetSettings } from './services';

export class SettingApplicationService {
  async getSettings(): Promise<any> {
    return GetSettings.getInstance().execute();
  }
  async updateSettings(request: any): Promise<any> {
    return UpdateSettings.getInstance().execute(request);
  }
  async resetSettings(): Promise<void> {
    return ResetSettings.getInstance().execute();
  }
}

export const settingApplicationService = new SettingApplicationService();
