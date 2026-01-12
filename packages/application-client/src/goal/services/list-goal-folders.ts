/**
 * List Goal Folders
 *
 * 获取目标文件夹列表用例
 */

import type { IGoalFolderApiClient } from '@dailyuse/infrastructure-client';
import type { GoalFolderClientDTO } from '@dailyuse/contracts/goal';
import { GoalFolder } from '@dailyuse/domain-client/goal';
import { GoalContainer } from '@dailyuse/infrastructure-client';

/**
 * List Goal Folders
 */
export class ListGoalFolders {
  private static instance: ListGoalFolders;

  private constructor(private readonly apiClient: IGoalFolderApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalFolderApiClient): ListGoalFolders {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getFolderApiClient();
    ListGoalFolders.instance = new ListGoalFolders(client);
    return ListGoalFolders.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ListGoalFolders {
    if (!ListGoalFolders.instance) {
      ListGoalFolders.instance = ListGoalFolders.createInstance();
    }
    return ListGoalFolders.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ListGoalFolders.instance = undefined as unknown as ListGoalFolders;
  }

  /**
   * 执行用例
   */
  async execute(params?: {
    page?: number;
    limit?: number;
    parentUuid?: string | null;
  }): Promise<GoalFolder[]> {
    const response = await this.apiClient.getGoalFolders(params);
    return response.folders.map((folderData: GoalFolderClientDTO) =>
      GoalFolder.fromClientDTO(folderData),
    );
  }
}
