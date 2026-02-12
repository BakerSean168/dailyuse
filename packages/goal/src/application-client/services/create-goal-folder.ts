/**
 * Create Goal Folder
 *
 * 创建目标文件夹用例
 */

import type { IGoalFolderApiClient } from '@/infrastructure-client';
import type { CreateGoalFolderRequest } from '@dailyuse/contracts/goal';
import { GoalFolder } from '@/domain-client';
import { GoalContainer } from '@/infrastructure-client';

/**
 * Create Goal Folder
 */
export class CreateGoalFolder {
  private static instance: CreateGoalFolder;

  private constructor(private readonly apiClient: IGoalFolderApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalFolderApiClient): CreateGoalFolder {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getFolderApiClient();
    CreateGoalFolder.instance = new CreateGoalFolder(client);
    return CreateGoalFolder.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CreateGoalFolder {
    if (!CreateGoalFolder.instance) {
      CreateGoalFolder.instance = CreateGoalFolder.createInstance();
    }
    return CreateGoalFolder.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CreateGoalFolder.instance = undefined as unknown as CreateGoalFolder;
  }

  /**
   * 执行用例
   */
  async execute(request: CreateGoalFolderRequest): Promise<GoalFolder> {
    const folderData = await this.apiClient.createGoalFolder(request);
    return GoalFolder.fromClientDTO(folderData);
  }
}
