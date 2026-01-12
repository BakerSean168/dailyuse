/**
 * Update Goal Folder
 *
 * 更新目标文件夹用例
 */

import type { IGoalFolderApiClient } from '@dailyuse/infrastructure-client';
import type { UpdateGoalFolderRequest } from '@dailyuse/contracts/goal';
import { GoalFolder } from '@dailyuse/domain-client/goal';
import { GoalContainer } from '@dailyuse/infrastructure-client';

/**
 * Update Goal Folder
 */
export class UpdateGoalFolder {
  private static instance: UpdateGoalFolder;

  private constructor(private readonly apiClient: IGoalFolderApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalFolderApiClient): UpdateGoalFolder {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getFolderApiClient();
    UpdateGoalFolder.instance = new UpdateGoalFolder(client);
    return UpdateGoalFolder.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdateGoalFolder {
    if (!UpdateGoalFolder.instance) {
      UpdateGoalFolder.instance = UpdateGoalFolder.createInstance();
    }
    return UpdateGoalFolder.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdateGoalFolder.instance = undefined as unknown as UpdateGoalFolder;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string, request: UpdateGoalFolderRequest): Promise<GoalFolder> {
    const data = await this.apiClient.updateGoalFolder(uuid, request);
    return GoalFolder.fromClientDTO(data);
  }
}
