/**
 * Create Goal Folder Service
 *
 * 创建目标文件夹的应用服务
 */

import type { IGoalFolderRepository } from '@/domain-server';
import { GoalFolder } from '@/domain-server';
import type { IdentityId } from '@dailyuse/domain-shared';
import type { GoalFolderId } from '@/domain-shared';
import type { CreateGoalFolderReq, GoalFolderClientDTO } from '@dailyuse/contracts/goal';

/**
 * Create Goal Folder Service
 */
export class CreateGoalFolder {
  constructor(private readonly goalFolderRepository: IGoalFolderRepository) {}

  /**
   * 获取服务单例
   */

  async execute(identityId: IdentityId, input: CreateGoalFolderReq): Promise<GoalFolderClientDTO> {
    const folder = GoalFolder.create({
      identityId,
      name: input.name,
      description: input.description,
      color: input.color,
      icon: input.icon,
      parentFolderId: input.parentFolderId as GoalFolderId | undefined,
    });

    await this.goalFolderRepository.save(folder);

    return folder.toClientDTO();
  }
}
