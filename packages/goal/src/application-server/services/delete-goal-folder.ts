/**
 * Delete Goal Folder Service
 *
 * 删除目标文件夹的应用服务
 */

import type { IGoalFolderRepository } from '@/domain-server';

/**
 * Delete Goal Folder Service
 */
export class DeleteGoalFolder {
  constructor(private readonly goalFolderRepository: IGoalFolderRepository) {}

  /**
   * 获取服务单例
   */

  async execute(id: string, identityId: string): Promise<void> {
    const folder = await this.goalFolderRepository.findById(id);

    if (!folder) {
      throw new Error(`Goal folder not found: ${id}`);
    }

    // 验证所属账户
    if (folder.identityId !== identityId) {
      throw new Error('Unauthorized access to goal folder');
    }

    await this.goalFolderRepository.delete(id);
  }
}
