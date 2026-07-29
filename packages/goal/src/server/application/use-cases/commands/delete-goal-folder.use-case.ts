/**
 * Delete Goal Folder Use Case
 *
 * 删除目标文件夹的应用服务
 * 遵循 governance 模块 Result<T> 规范
 */

import type { IGoalFolderRepository } from '../../../domain';
import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';

/**
 * Delete Goal Folder Use Case
 */
export class DeleteGoalFolderUseCase {
  constructor(private readonly goalFolderRepository: IGoalFolderRepository) {}

  /**
   * 获取服务单例
   */

  async execute(id: string, identityId: string): Promise<Result<void>> {
    const folder = await this.goalFolderRepository.findByIdForIdentity(identityId, id);

    if (!folder) {
      return error('NOT_FOUND', `Goal folder not found: ${id}`);
    }

    folder.softDelete();
    await this.goalFolderRepository.save(folder);

    return ok(undefined);
  }
}
