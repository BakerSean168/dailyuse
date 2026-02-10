/**
 * Delete Goal Folder
 *
 * 删除目标文件夹用例
 */

import type { IGoalFolderApiClient } from '@/infrastructure-client';
import { GoalContainer } from '@/infrastructure-client';

/**
 * Delete Goal Folder
 */
export class DeleteGoalFolder {
  private static instance: DeleteGoalFolder;

  private constructor(private readonly apiClient: IGoalFolderApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalFolderApiClient): DeleteGoalFolder {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getFolderApiClient();
    DeleteGoalFolder.instance = new DeleteGoalFolder(client);
    return DeleteGoalFolder.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DeleteGoalFolder {
    if (!DeleteGoalFolder.instance) {
      DeleteGoalFolder.instance = DeleteGoalFolder.createInstance();
    }
    return DeleteGoalFolder.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DeleteGoalFolder.instance = undefined as unknown as DeleteGoalFolder;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<void> {
    await this.apiClient.deleteGoalFolder(uuid);
  }
}

/**
 * 便捷函数
 */
export const deleteGoalFolder = (uuid: string): Promise<void> =>
  DeleteGoalFolder.getInstance().execute(uuid);
