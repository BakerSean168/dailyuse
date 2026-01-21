/**
 * List Goal Folders Service
 *
 * 获取用户目标文件夹列表的应用服务
 */

import type { IGoalFolderRepository } from '@dailyuse/domain-server/goal';
import { GoalFolder } from '@dailyuse/domain-server/goal';
import type { QueryGoalFoldersRequest, GoalFoldersResponse } from '@dailyuse/contracts/goal';

/**
 * List Goal Folders Service
 */
export class ListGoalFolders {
  private static instance: ListGoalFolders;

  private constructor(private readonly goalFolderRepository: IGoalFolderRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(goalFolderRepository: IGoalFolderRepository): ListGoalFolders {
    ListGoalFolders.instance = new ListGoalFolders(goalFolderRepository);
    return ListGoalFolders.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ListGoalFolders {
    if (!ListGoalFolders.instance) {
      throw new Error('ListGoalFolders instance not initialized. Call createInstance() first.');
    }
    return ListGoalFolders.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ListGoalFolders.instance = undefined as unknown as ListGoalFolders;
  }

  async execute(input: QueryGoalFoldersRequest): Promise<GoalFoldersResponse> {
    const folders = await this.goalFolderRepository.findByAccountUuid(input.accountUuid);

    return {
      folders: folders.map((f: GoalFolder) => f.toClientDTO()),
      total: folders.length,
    };
  }
}
