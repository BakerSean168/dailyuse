/**
 * List Goal Folders Service
 *
 * 获取用户目标文件夹列表的应用服务
 */

import type { IGoalFolderRepository } from '@dailyuse/domain-server/goal';
import { GoalFolder } from '@dailyuse/domain-server/goal';
import type { QueryGoalFoldersRequest, GoalFoldersResponse } from '@dailyuse/contracts/goal';

/**
 * List Goal Folders Service
 */
export class ListGoalFolders {
  constructor(private readonly goalFolderRepository: IGoalFolderRepository) {}

  async execute(input: QueryGoalFoldersRequest): Promise<GoalFoldersResponse> {
    const folders = await this.goalFolderRepository.findByAccountUuid(input.accountUuid);

    return {
      folders: folders.map((f: GoalFolder) => f.toClientDTO()),
      total: folders.length,
    };
  }
}
