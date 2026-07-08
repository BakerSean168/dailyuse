/**
 * Delete Goal Folder Use Case
 *
 * 删除目标文件夹的应用服务
 * 遵循 governance 模块 Result<T> 规范
 */

import type { IGoalFolderRepository } from '../../../domain';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

/**
 * Delete Goal Folder Use Case
 */
export class DeleteGoalFolderUseCase {
  constructor(private readonly goalFolderRepository: IGoalFolderRepository) {}

  /**
   * 获取服务单例
   */

  async execute(id: string, identityId: string): Promise<Result<void>> {
    const folder = await this.goalFolderRepository.findById(id);

    if (!folder) {
      return error('NOT_FOUND', `Goal folder not found: ${id}`);
    }

    // 验证所属账户
    if (folder.identityId !== identityId) {
      return error('FORBIDDEN', 'Unauthorized access to goal folder');
    }

    folder.softDelete();
    await this.goalFolderRepository.save(folder);

    return ok(undefined);
  }
}
