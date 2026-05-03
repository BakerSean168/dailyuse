/**
 * List Goal Folders Use Case
 *
 * 获取用户目标文件夹列表的应用服务
 * 遵循 governance 模块 Result<T> 规范
 */

import type { IGoalFolderRepository } from '@/domain-server';
import { GoalFolder } from '@/domain-server';
import type { ListGoalFoldersQuery, QueryGoalFoldersRes } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

/**
 * List Goal Folders Use Case
 */
export class ListGoalFoldersUseCase {
  constructor(private readonly goalFolderRepository: IGoalFolderRepository) {}

  async execute(input: ListGoalFoldersQuery): Promise<Result<QueryGoalFoldersRes>> {
    const folders = await this.goalFolderRepository.findByIdentityId(input.identityId);

    return ok({
      data: folders.map((f: GoalFolder) => f.toClientDTO()),
      total: folders.length,
    });
  }
}
