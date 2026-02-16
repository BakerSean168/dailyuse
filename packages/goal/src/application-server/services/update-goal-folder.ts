/**
 * Update Goal Folder Service
 *
 * 更新目标文件夹的应用服务
 */

import type { IGoalFolderRepository } from '@/domain-server';
import type { UpdateGoalFolderReq, UpdateGoalFolderRes } from '@dailyuse/contracts/goal';

/**
 * Update Goal Folder Service
 */
export class UpdateGoalFolder {
  constructor(private readonly goalFolderRepository: IGoalFolderRepository) {}

  async execute(
    uuid: string,
    accountUuid: string,
    input: UpdateGoalFolderReq,
  ): Promise<UpdateGoalFolderRes> {
    const folder = await this.goalFolderRepository.findById(uuid);

    if (!folder) {
      throw new Error(`Goal folder not found: ${uuid}`);
    }

    // 验证所属账户
    if (folder.identityId !== accountUuid) {
      throw new Error('Unauthorized access to goal folder');
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

    return folder.toClientDTO();
  }
}
