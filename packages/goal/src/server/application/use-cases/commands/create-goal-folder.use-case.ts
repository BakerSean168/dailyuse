/**
 * Create Goal Folder Use Case
 *
 * 创建目标文件夹的应用服务
 * 遵循 governance 模块 Result<T> 规范
 */

import type { IGoalFolderRepository } from '../../../domain';
import { GoalFolder } from '../../../domain';
import type { IdentityId } from '@dailyuse/domain-shared';
import type { GoalFolderId } from '../../../domain';
import type { CreateGoalFolderReq, GoalFolderClientDTO } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

/**
 * Create Goal Folder Use Case
 */
export class CreateGoalFolderUseCase {
  constructor(private readonly goalFolderRepository: IGoalFolderRepository) {}

  /**
   * 获取服务单例
   */

  async execute(
    identityId: IdentityId,
    input: CreateGoalFolderReq,
  ): Promise<Result<GoalFolderClientDTO>> {
    const folder = GoalFolder.create({
      identityId,
      name: input.name,
      description: input.description,
      color: input.color,
      icon: input.icon,
      parentFolderId: input.parentFolderId as GoalFolderId | undefined,
    });

    await this.goalFolderRepository.save(folder);

    return ok(folder.toClientDTO());
  }
}
