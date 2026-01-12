/**
 * Update Appearance
 *
 * 更新外观设置用例
 */

import type { ISettingApiClient } from '@dailyuse/infrastructure-client';
import type { UpdateAppearanceRequest } from '@dailyuse/contracts/setting';
import { SettingContainer } from '@dailyuse/infrastructure-client';
import { UserSetting } from '@dailyuse/domain-client/setting';

/**
 * Update Appearance Input
 */
export type UpdateAppearanceInput = UpdateAppearanceRequest;

/**
 * Update Appearance
 */
export class UpdateAppearance {
  private static instance: UpdateAppearance;

  private constructor(private readonly apiClient: ISettingApiClient) {}

  static createInstance(apiClient?: ISettingApiClient): UpdateAppearance {
    const container = SettingContainer.getInstance();
    const client = apiClient || container.getApiClient();
    UpdateAppearance.instance = new UpdateAppearance(client);
    return UpdateAppearance.instance;
  }

  static getInstance(): UpdateAppearance {
    if (!UpdateAppearance.instance) {
      UpdateAppearance.instance = UpdateAppearance.createInstance();
    }
    return UpdateAppearance.instance;
  }

  static resetInstance(): void {
    UpdateAppearance.instance = undefined as unknown as UpdateAppearance;
  }

  async execute(input: UpdateAppearanceInput): Promise<UserSetting> {
    const dto = await this.apiClient.updateAppearance(input);
    return UserSetting.fromClientDTO(dto);
  }
}

export const updateAppearance = (input: UpdateAppearanceInput): Promise<UserSetting> =>
  UpdateAppearance.getInstance().execute(input);
