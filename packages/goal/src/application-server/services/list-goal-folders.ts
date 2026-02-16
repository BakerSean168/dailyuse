/**
 * List Goal Folders Service
 *
 * 获取用户目标文件夹列表的应用服务
 */

import type { IGoalFolderRepository } from '@/domain-server';
import { GoalFolder } from '@/domain-server';
import type { QueryGoalFoldersReq, QueryGoalFoldersRes } from '@dailyuse/contracts/goal';

/**
 * List Goal Folders Service
 */
export class ListGoalFolders {
  constructor(private readonly goalFolderRepository: IGoalFolderRepository) {}

  async execute(input: QueryGoalFoldersReq): Promise<QueryGoalFoldersRes> {
    const folders = await this.goalFolderRepository.findByIdentityId(input.identityId);

    return {
      data: folders.map((f: GoalFolder) => f.toClientDTO()),
      total: folders.length,
    };
  }
}
