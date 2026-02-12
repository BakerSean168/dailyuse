/**
 * Get Goal Folder
 *
 * 获取目标文件夹详情用例
 */

import type { IGoalFolderApiClient } from '@/infrastructure-client';
import { GoalFolder } from '@/domain-client';
import { GoalContainer } from '@/infrastructure-client';

/**
 * Get Goal Folder
 */
export class GetGoalFolder {
  private static instance: GetGoalFolder;

  private constructor(private readonly apiClient: IGoalFolderApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalFolderApiClient): GetGoalFolder {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getFolderApiClient();
    GetGoalFolder.instance = new GetGoalFolder(client);
    return GetGoalFolder.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetGoalFolder {
    if (!GetGoalFolder.instance) {
      GetGoalFolder.instance = GetGoalFolder.createInstance();
    }
    return GetGoalFolder.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetGoalFolder.instance = undefined as unknown as GetGoalFolder;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<GoalFolder> {
    const data = await this.apiClient.getGoalFolderById(uuid);
    return GoalFolder.fromClientDTO(data);
  }
}

/**
 * 便捷函数
 */
export const getGoalFolder = (uuid: string): Promise<GoalFolder> =>
  GetGoalFolder.getInstance().execute(uuid);
