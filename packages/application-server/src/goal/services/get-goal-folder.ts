/**
 * Get Goal Folder Service
 *
 * 获取单个目标文件夹的应用服务
 */

import type { IGoalFolderRepository } from '@dailyuse/domain-server/goal';
import { GoalFolder } from '@dailyuse/domain-server/goal';
import type { GoalFolderResponse } from '@dailyuse/contracts/goal';
import { GoalContainer } from '@dailyuse/infrastructure-server';

/**
 * Get Goal Folder Service
 */
export class GetGoalFolder {
  private static instance: GetGoalFolder;

  private constructor(private readonly goalFolderRepository: IGoalFolderRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(goalFolderRepository?: IGoalFolderRepository): GetGoalFolder {
    const container = GoalContainer.getInstance();
    const repo = goalFolderRepository || container.getGoalFolderRepository();
    GetGoalFolder.instance = new GetGoalFolder(repo);
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

  async execute(uuid: string, accountUuid: string): Promise<GoalFolderResponse> {
    const folder = await this.goalFolderRepository.findById(uuid);

    if (!folder) {
      throw new Error(`Goal folder not found: ${uuid}`);
    }

    // 验证所属账户
    if (folder.accountUuid !== accountUuid) {
      throw new Error('Unauthorized access to goal folder');
    }

    return {
      folder: folder.toClientDTO(),
    };
  }
}
