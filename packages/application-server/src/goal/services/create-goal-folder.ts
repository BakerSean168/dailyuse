/**
 * Create Goal Folder Service
 *
 * 创建目标文件夹的应用服务
 */

import type { IGoalFolderRepository } from '@dailyuse/domain-server/goal';
import { GoalFolder } from '@dailyuse/domain-server/goal';
import type { CreateGoalFolderRequest, GoalFolderResponse } from '@dailyuse/contracts/goal';

/**
 * Create Goal Folder Service
 */
export class CreateGoalFolder {
  constructor(private readonly goalFolderRepository: IGoalFolderRepository) {}

  /**
   * 获取服务单例
   */

  async execute(accountUuid: string, input: CreateGoalFolderRequest): Promise<GoalFolderResponse> {
    const folder = GoalFolder.create({
      accountUuid,
      name: input.name,
      description: input.description,
      color: input.color,
      icon: input.icon,
      parentFolderUuid: input.parentFolderUuid,
    });

    await this.goalFolderRepository.save(folder);

    return {
      folder: folder.toClientDTO(),
    };
  }
}
