/**
 * @file GoalFolderApplicationService.ts
 * @description 目标文件夹应用服务，协调领域服务和仓储处理业务逻辑。
 * @date 2025-01-22
 */

import type { IGoalFolderRepository, IGoalRepository } from '@dailyuse/domain-server/goal';
import { GoalFolderDomainService, GoalFolder, Goal } from '@dailyuse/domain-server/goal';
import type {
  GoalServerDTO,
  GoalClientDTO,
  KeyResultServerDTO,
  GoalFolderClientDTO,
} from '@dailyuse/contracts/goal';

/**
 * GoalFolder 应用服务。
 *
 * @remarks
 * 负责协调领域服务和仓储，处理文件夹管理业务用例。
 *
 * 架构职责：
 * - 委托给 DomainService 处理业务逻辑
 * - 协调多个领域服务
 * - 事务管理
 * - DTO 转换（Domain → ClientDTO）
 * - 调用 Repository 进行持久化
 */
export class GoalFolderApplicationService {
  private domainService: GoalFolderDomainService;
  private folderRepository: IGoalFolderRepository;
  private goalRepository: IGoalRepository;

  constructor(folderRepository: IGoalFolderRepository, goalRepository: IGoalRepository) {
    this.domainService = new GoalFolderDomainService();
    this.folderRepository = folderRepository;
    this.goalRepository = goalRepository;
  }

  // ===== GoalFolder CRUD 操作 =====

  /**
   * 创建文件夹。
   *
   * @remarks
   * 1. 验证名称和颜色。
   * 2. 检查重名。
   * 3. 验证父文件夹（如果存在）。
   * 4. 创建聚合根并验证深度。
   * 5. 持久化。
   *
   * @param accountUuid - 账户 UUID
   * @param params - 创建参数 (name, description, icon, color, parentFolderUuid, sortOrder)
   * @returns {Promise<GoalFolderClientDTO>} 创建的文件夹 DTO
   */
  async createFolder(
    accountUuid: string,
    params: {
      name: string;
      description?: string;
      icon?: string;
      color?: string;
      parentFolderUuid?: string;
      sortOrder?: number;
    },
  ): Promise<GoalFolderClientDTO> {
    // 1. 验证名称
    this.domainService.validateFolderName(params.name);

    // 2. 验证颜色
    if (params.color) {
      this.domainService.validateColor(params.color);
    }

    // 3. 查询现有文件夹（检查重名）
    const existingFolders = await this.folderRepository.findByAccountUuid(accountUuid);
    this.domainService.checkDuplicateName(params.name, accountUuid, existingFolders);

    // 4. 如果指定了父文件夹，验证父文件夹
    let parentFolder: GoalFolder | null = null;
    if (params.parentFolderUuid) {
      parentFolder = await this.folderRepository.findById(params.parentFolderUuid);
      if (!parentFolder) {
        throw new Error('父文件夹不存在');
      }
      this.domainService.validateParentFolder(parentFolder, accountUuid);
    }

    // 5. 创建文件夹聚合根
    const folder = GoalFolder.create({
      accountUuid,
      name: params.name,
      description: params.description,
      icon: params.icon,
      color: params.color,
      parentFolderUuid: params.parentFolderUuid,
      sortOrder: params.sortOrder,
    });

    // 6. 验证嵌套深度
    this.domainService.validateFolderDepth(folder, existingFolders);

    // 7. 持久化
    await this.folderRepository.save(folder);

    // 8. 返回 DTO
    return folder.toClientDTO();
  }

  /**
   * 获取文件夹。
   *
   * @param uuid - 文件夹 UUID
   * @returns {Promise<GoalFolderClientDTO | null>} 文件夹 DTO 或 null
   */
  async getFolder(uuid: string): Promise<GoalFolderClientDTO | null> {
    const folder = await this.folderRepository.findById(uuid);
    return folder ? folder.toClientDTO() : null;
  }

  /**
   * 获取账户的所有文件夹。
   *
   * @param accountUuid - 账户 UUID
   * @returns {Promise<GoalFolderClientDTO[]>} 文件夹列表
   */
  async getFoldersByAccount(accountUuid: string): Promise<GoalFolderClientDTO[]> {
    const folders = await this.folderRepository.findByAccountUuid(accountUuid);
    return folders.map((folder) => folder.toClientDTO());
  }

  /**
   * 更新文件夹。
   *
   * @remarks
   * 支持更新名称、描述、图标、颜色和排序。
   * 系统文件夹不能重名。
   *
   * @param uuid - 文件夹 UUID
   * @param params - 更新参数
   * @returns {Promise<GoalFolderClientDTO>} 更新后的文件夹 DTO
   */
  async updateFolder(
    uuid: string,
    params: {
      name?: string;
      description?: string;
      icon?: string;
      color?: string;
      sortOrder?: number;
    },
  ): Promise<GoalFolderClientDTO> {
    // 1. 查询文件夹
    const folder = await this.folderRepository.findById(uuid);
    if (!folder) {
      throw new Error('文件夹不存在');
    }

    // 2. 系统文件夹不能修改名称
    if (params.name && folder.isSystemFolder) {
      throw new Error('系统文件夹不能修改名称');
    }

    // 3. 如果更新名称，验证名称和重名
    if (params.name) {
      this.domainService.validateFolderName(params.name);

      const existingFolders = await this.folderRepository.findByAccountUuid(folder.accountUuid);
      this.domainService.checkDuplicateName(params.name, folder.accountUuid, existingFolders, uuid);
    }

    // 4. 如果更新颜色，验证颜色
    if (params.color) {
      this.domainService.validateColor(params.color);
    }

    // 5. 调用聚合根方法更新属性
    if (params.name) {
      folder.rename(params.name);
    }
    if (params.description !== undefined) {
      folder.updateDescription(params.description);
    }
    if (params.icon !== undefined) {
      folder.updateIcon(params.icon);
    }
    if (params.color !== undefined) {
      folder.updateColor(params.color);
    }

    // 6. 持久化
    await this.folderRepository.save(folder);

    // 7. 返回 DTO
    return folder.toClientDTO();
  }

  /**
   * 删除文件夹。
   *
   * @remarks
   * 软删除文件夹，并将文件夹内的目标移动到根目录。
   *
   * @param uuid - 文件夹 UUID
   * @returns {Promise<void>}
   */
  async deleteFolder(uuid: string): Promise<void> {
    // 1. 查询文件夹
    const folder = await this.folderRepository.findById(uuid);
    if (!folder) {
      throw new Error('文件夹不存在');
    }

    // 2. 验证是否可以删除
    this.domainService.validateFolderDeletion(folder);

    // 3. 查询文件夹中的所有目标
    const goalsInFolder = await this.goalRepository.findByAccountUuid(folder.accountUuid, {});
    const affectedGoals = goalsInFolder.filter((g) => g.folderUuid === uuid);

    // 4. 将目标移至根目录（folderUuid = null）
    for (const goal of affectedGoals) {
      goal.moveToFolder(null);
      await this.goalRepository.save(goal);
    }

    // 5. 软删除文件夹
    folder.softDelete();

    // 6. 持久化文件夹
    await this.folderRepository.save(folder);
  }

  /**
   * 恢复已删除的文件夹。
   *
   * @param uuid - 文件夹 UUID
   * @returns {Promise<GoalFolderClientDTO>} 恢复后的文件夹 DTO
   */
  async restoreFolder(uuid: string): Promise<GoalFolderClientDTO> {
    // 1. 查询文件夹
    const folder = await this.folderRepository.findById(uuid);
    if (!folder) {
      throw new Error('文件夹不存在');
    }

    // 2. 检查是否已删除
    if (folder.deletedAt === null) {
      throw new Error('文件夹未被删除');
    }

    // 3. 恢复文件夹
    folder.restore();

    // 4. 持久化
    await this.folderRepository.save(folder);

    // 5. 返回 DTO
    return folder.toClientDTO();
  }

  // ===== 目标移动操作 =====

  /**
   * 移动目标到文件夹。
   *
   * @remarks
   * 更新目标和相关文件夹的统计信息。
   *
   * @param goalUuid - 目标 UUID
   * @param folderUuid - 目标文件夹 UUID (null 表示根目录)
   * @returns {Promise<GoalClientDTO>} 移动后的目标 DTO
   */
  async moveGoalToFolder(goalUuid: string, folderUuid: string | null): Promise<GoalClientDTO> {
    // 1. 查询目标
    const goal = await this.goalRepository.findById(goalUuid);
    if (!goal) {
      throw new Error('目标不存在');
    }

    // 2. 如果指定了文件夹，查询文件夹
    let folder: GoalFolder | null = null;
    if (folderUuid) {
      folder = await this.folderRepository.findById(folderUuid);
      if (!folder) {
        throw new Error('目标文件夹不存在');
      }
    }

    // 3. 验证移动规则
    this.domainService.validateGoalMove(goal, folder);

    // 4. 记录原文件夹 UUID（用于更新统计）
    const oldFolderUuid = goal.folderUuid;

    // 5. 移动目标
    goal.moveToFolder(folderUuid);

    // 6. 持久化目标
    await this.goalRepository.save(goal);

    // 7. 更新源文件夹统计
    if (oldFolderUuid) {
      await this.updateFolderStatisticsInternal(oldFolderUuid);
    }

    // 8. 更新目标文件夹统计
    if (folderUuid) {
      await this.updateFolderStatisticsInternal(folderUuid);
    }

    // 9. 返回 DTO
    return goal.toClientDTO();
  }

  /**
   * 批量移动目标到文件夹。
   *
   * @param goalUuids - 目标 UUID 列表
   * @param folderUuid - 目标文件夹 UUID
   * @param accountUuid - 账户 UUID
   * @returns {Promise<void>}
   */
  async batchMoveGoalsToFolder(
    goalUuids: string[],
    folderUuid: string | null,
    accountUuid: string,
  ): Promise<void> {
    // 1. 查询所有目标
    const goals = await Promise.all(goalUuids.map((uuid) => this.goalRepository.findById(uuid)));

    // 过滤掉不存在的目标
    const validGoals = goals.filter((g): g is Goal => g !== null);

    if (validGoals.length === 0) {
      throw new Error('没有有效的目标');
    }

    // 2. 如果指定了文件夹，查询文件夹
    let folder: GoalFolder | null = null;
    if (folderUuid) {
      folder = await this.folderRepository.findById(folderUuid);
      if (!folder) {
        throw new Error('目标文件夹不存在');
      }
    }

    // 3. 验证批量移动
    this.domainService.validateBatchGoalMove(validGoals, folder, accountUuid);

    // 4. 收集受影响的文件夹 UUID
    const affectedFolderUuids = new Set<string>();

    // 5. 移动所有目标
    for (const goal of validGoals) {
      const oldFolderUuid = goal.folderUuid;
      if (oldFolderUuid) {
        affectedFolderUuids.add(oldFolderUuid);
      }

      goal.moveToFolder(folderUuid);
      await this.goalRepository.save(goal);
    }

    // 6. 如果有目标文件夹，也添加到受影响列表
    if (folderUuid) {
      affectedFolderUuids.add(folderUuid);
    }

    // 7. 更新所有受影响文件夹的统计
    for (const affectedFolderUuid of affectedFolderUuids) {
      await this.updateFolderStatisticsInternal(affectedFolderUuid);
    }
  }

  // ===== 统计更新 =====

  /**
   * 更新文件夹统计信息。
   *
   * @remarks
   * 重新计算文件夹内的目标数量和完成度，并持久化。
   *
   * @param folderUuid - 文件夹 UUID
   * @returns {Promise<GoalFolderClientDTO>} 更新后的文件夹 DTO
   */
  async updateFolderStatistics(folderUuid: string): Promise<GoalFolderClientDTO> {
    await this.updateFolderStatisticsInternal(folderUuid);

    const folder = await this.folderRepository.findById(folderUuid);
    if (!folder) {
      throw new Error('文件夹不存在');
    }

    return folder.toClientDTO();
  }

  /**
   * 更新文件夹统计信息（内部方法）。
   *
   * @param folderUuid - 文件夹 UUID
   * @returns {Promise<void>}
   */
  private async updateFolderStatisticsInternal(folderUuid: string): Promise<void> {
    // 1. 查询文件夹
    const folder = await this.folderRepository.findById(folderUuid);
    if (!folder) return;

    // 2. 查询文件夹中的所有目标
    const allGoals = await this.goalRepository.findByAccountUuid(folder.accountUuid, {});
    const goalsInFolder = allGoals.filter((g) => g.folderUuid === folderUuid);

    // 3. 委托给 DomainService 更新统计
    this.domainService.updateFolderStatistics(folder, goalsInFolder);

    // 4. 持久化
    await this.folderRepository.save(folder);
  }

  /**
   * 批量更新所有文件夹统计。
   *
   * @param accountUuid - 账户 UUID
   * @returns {Promise<void>}
   */
  async updateAllFolderStatistics(accountUuid: string): Promise<void> {
    const folders = await this.folderRepository.findByAccountUuid(accountUuid);

    for (const folder of folders) {
      await this.updateFolderStatisticsInternal(folder.uuid);
    }
  }
}
