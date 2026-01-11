/**
 * Create Goal Folder Service
 *
 * 创建目标文件夹的应用服务
 */

import type { IGoalFolderRepository } from '@dailyuse/domain-server/goal';
import { GoalFolder } from '@dailyuse/domain-server/goal';
import type { CreateGoalFolderRequest, GoalFolderResponse } from '@dailyuse/contracts/goal';
import { GoalContainer } from '@dailyuse/infrastructure-server';

/**
 * Create Goal Folder Service
 */
export class CreateGoalFolder {
  private static instance: CreateGoalFolder;

  private constructor(private readonly goalFolderRepository: IGoalFolderRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(goalFolderRepository?: IGoalFolderRepository): CreateGoalFolder {
    const container = GoalContainer.getInstance();
    const repo = goalFolderRepository || container.getGoalFolderRepository();
    CreateGoalFolder.instance = new CreateGoalFolder(repo);
    return CreateGoalFolder.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CreateGoalFolder {
    if (!CreateGoalFolder.instance) {
      CreateGoalFolder.instance = CreateGoalFolder.createInstance();
    }
    return CreateGoalFolder.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CreateGoalFolder.instance = undefined as unknown as CreateGoalFolder;
  }

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
