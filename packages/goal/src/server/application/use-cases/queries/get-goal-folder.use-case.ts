/**
 * Get Goal Folder Use Case
 *
 * 获取单个目标文件夹的应用服务
 * 遵循 governance 模块 Result<T> 规范
 */

import type { IGoalFolderRepository } from '../../../domain';
import type { GoalFolderClientDTO } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

/**
 * Get Goal Folder Use Case
 */
export class GetGoalFolderUseCase {
  constructor(private readonly goalFolderRepository: IGoalFolderRepository) {}

  /**
   * 获取服务单例
   */

  async execute(id: string): Promise<Result<GoalFolderClientDTO>> {
    const folder = await this.goalFolderRepository.findById(id);

    if (!folder) {
      return error('NOT_FOUND', `Goal folder not found: ${id}`);
    }

    return ok(folder.toClientDTO());
  }
}
