/**
 * Update Goal Folder Use Case
 *
 * 更新目标文件夹的应用服务
 * 遵循 governance 模块 Result<T> 规范
 */

import type { IGoalFolderRepository } from '../../../domain';
import type { UpdateGoalFolderReq, UpdateGoalFolderRes } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

/**
 * Update Goal Folder Use Case
 */
export class UpdateGoalFolderUseCase {
  constructor(private readonly goalFolderRepository: IGoalFolderRepository) {}

  async execute(
    id: string,
    identityId: string,
    input: UpdateGoalFolderReq,
  ): Promise<Result<UpdateGoalFolderRes>> {
    const folder = await this.goalFolderRepository.findById(id);

    if (!folder) {
      return error('NOT_FOUND', `Goal folder not found: ${id}`);
    }

    // 验证所属账户
    if (folder.identityId !== identityId) {
      return error('FORBIDDEN', 'Unauthorized access to goal folder');
    }

    // 使用领域方法更新属性
    if (input.name !== undefined) {
      folder.rename(input.name);
    }
    if (input.description !== undefined) {
      folder.updateDescription(input.description ?? '');
    }
    if (input.color !== undefined) {
      folder.updateColor(input.color ?? '');
    }
    if (input.icon !== undefined) {
      folder.updateIcon(input.icon ?? '');
    }

    await this.goalFolderRepository.save(folder);

    return ok(folder.toClientDTO());
  }
}
