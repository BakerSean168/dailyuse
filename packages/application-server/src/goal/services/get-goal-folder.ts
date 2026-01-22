/**
 * Get Goal Folder Service
 *
 * 获取单个目标文件夹的应用服务
 */

import type { IGoalFolderRepository } from '@dailyuse/domain-server/goal';
import { GoalFolder } from '@dailyuse/domain-server/goal';
import type { GoalFolderResponse } from '@dailyuse/contracts/goal';

/**
 * Get Goal Folder Service
 */
export class GetGoalFolder {
  constructor(private readonly goalFolderRepository: IGoalFolderRepository) {}

  /**
   * 获取服务单例
   */

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
