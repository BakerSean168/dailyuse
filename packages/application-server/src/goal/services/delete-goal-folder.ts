/**
 * Delete Goal Folder Service
 *
 * 删除目标文件夹的应用服务
 */

import type { IGoalFolderRepository } from '@dailyuse/domain-server/goal';
import { GoalContainer } from '@dailyuse/infrastructure-server';

/**
 * Delete Goal Folder Service
 */
export class DeleteGoalFolder {
  private static instance: DeleteGoalFolder;

  private constructor(private readonly goalFolderRepository: IGoalFolderRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(goalFolderRepository?: IGoalFolderRepository): DeleteGoalFolder {
    const container = GoalContainer.getInstance();
    const repo = goalFolderRepository || container.getGoalFolderRepository();
    DeleteGoalFolder.instance = new DeleteGoalFolder(repo);
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

  async execute(uuid: string, accountUuid: string): Promise<void> {
    const folder = await this.goalFolderRepository.findById(uuid);

    if (!folder) {
      throw new Error(`Goal folder not found: ${uuid}`);
    }

    // 验证所属账户
    if (folder.accountUuid !== accountUuid) {
      throw new Error('Unauthorized access to goal folder');
    }

    await this.goalFolderRepository.delete(uuid);
  }
}
