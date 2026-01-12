/**
 * Update Locale
 *
 * 更新语言区域设置用例
 */

import type { ISettingApiClient } from '@dailyuse/infrastructure-client';
import type { UpdateLocaleRequest } from '@dailyuse/contracts/setting';
import { SettingContainer } from '@dailyuse/infrastructure-client';
import { UserSetting } from '@dailyuse/domain-client/setting';

/**
 * Update Locale Input
 */
export type UpdateLocaleInput = UpdateLocaleRequest;

/**
 * Update Locale
 */
export class UpdateLocale {
  private static instance: UpdateLocale;

  private constructor(private readonly apiClient: ISettingApiClient) {}

  static createInstance(apiClient?: ISettingApiClient): UpdateLocale {
    const container = SettingContainer.getInstance();
    const client = apiClient || container.getApiClient();
    UpdateLocale.instance = new UpdateLocale(client);
    return UpdateLocale.instance;
  }

  static getInstance(): UpdateLocale {
    if (!UpdateLocale.instance) {
      UpdateLocale.instance = UpdateLocale.createInstance();
    }
    return UpdateLocale.instance;
  }

  static resetInstance(): void {
    UpdateLocale.instance = undefined as unknown as UpdateLocale;
  }

  async execute(input: UpdateLocaleInput): Promise<UserSetting> {
    const dto = await this.apiClient.updateLocale(input);
    return UserSetting.fromClientDTO(dto);
  }
}

export const updateLocale = (input: UpdateLocaleInput): Promise<UserSetting> =>
  UpdateLocale.getInstance().execute(input);
