/**
 * Update Goal Folder Service
 *
 * 更新目标文件夹的应用服务
 */

import type { IGoalFolderRepository } from '@dailyuse/domain-server/goal';
import type { UpdateGoalFolderRequest, GoalFolderResponse } from '@dailyuse/contracts/goal';

/**
 * Update Goal Folder Service
 */
export class UpdateGoalFolder {
  private static instance: UpdateGoalFolder;

  private constructor(private readonly goalFolderRepository: IGoalFolderRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(goalFolderRepository: IGoalFolderRepository): UpdateGoalFolder {
    UpdateGoalFolder.instance = new UpdateGoalFolder(goalFolderRepository);
    return UpdateGoalFolder.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdateGoalFolder {
    if (!UpdateGoalFolder.instance) {
      throw new Error('UpdateGoalFolder instance not initialized. Call createInstance() first.');
    }
    return UpdateGoalFolder.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdateGoalFolder.instance = undefined as unknown as UpdateGoalFolder;
  }

  async execute(uuid: string, accountUuid: string, input: UpdateGoalFolderRequest): Promise<GoalFolderResponse> {
    const folder = await this.goalFolderRepository.findById(uuid);

    if (!folder) {
      throw new Error(`Goal folder not found: ${uuid}`);
    }

    // 验证所属账户
    if (folder.accountUuid !== accountUuid) {
      throw new Error('Unauthorized access to goal folder');
    }

    // 使用领域方法更新属性
    if (input.name !== undefined) {
      folder.rename(input.name);
    }
    if (input.description !== undefined) {
      folder.updateDescription(input.description);
    }
    if (input.color !== undefined) {
      folder.updateColor(input.color);
    }
    if (input.icon !== undefined) {
      folder.updateIcon(input.icon);
    }

    await this.goalFolderRepository.save(folder);

    return {
      folder: folder.toClientDTO(),
    };
  }
}
