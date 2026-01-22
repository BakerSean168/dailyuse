/**
 * Delete Goal Folder Service
 *
 * 删除目标文件夹的应用服务
 */

import type { IGoalFolderRepository } from '@dailyuse/domain-server/goal';

/**
 * Delete Goal Folder Service
 */
export class DeleteGoalFolder {
  constructor(private readonly goalFolderRepository: IGoalFolderRepository) {}

  /**
   * 获取服务单例
   */

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
