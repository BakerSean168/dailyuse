/**
 * Get Goal Folder Service
 *
 * 获取单个目标文件夹的应用服务
 */

import type { IGoalFolderRepository } from '@/domain-server';
import { GoalFolder } from '@/domain-server';
import type { GoalFolderClientDTO } from '@dailyuse/contracts/goal';

/**
 * Get Goal Folder Service
 */
export class GetGoalFolder {
  constructor(private readonly goalFolderRepository: IGoalFolderRepository) {}

  /**
   * 获取服务单例
   */

  async execute(id: string): Promise<GoalFolderClientDTO | null> {
    const folder = await this.goalFolderRepository.findById(id);

    if (!folder) {
      return null;
    }

    return folder.toClientDTO();
  }
}
