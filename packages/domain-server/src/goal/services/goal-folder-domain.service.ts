/**
 * GoalFolder 领域服务
 *
 * DDD 领域服务职责：
 * - 纯业务逻辑（不注入 Repository）
 * - 验证文件夹业务规则
 * - 协调多个聚合根的业务逻辑
 *
 * 注意：
 * - 所有方法都是同步的（纯业务逻辑）
 * - 不依赖外部服务
 * - ApplicationService 负责查询和持久化
 */

import type { GoalFolder } from '../aggregates/goal-folder';
import type { Goal } from '../aggregates/goal';

/**
 * GoalFolderDomainService
 *
 * 纯业务逻辑服务，负责文件夹管理规则
 */
export class GoalFolderDomainService {
  /**
   * 构造函数 - 无依赖注入
   */
  constructor() {}

  /**
   * 验证文件夹名称
   *
   * @param name - 文件夹名称
   * @throws Error - 如果名称无效
   */
  validateFolderName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('文件夹名称不能为空');
    }

    const trimmedName = name.trim();

    if (trimmedName.length > 100) {
      throw new Error('文件夹名称不能超过 100 个字符');
    }

    // 检查特殊字符（可选）
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(trimmedName)) {
      throw new Error('文件夹名称包含非法字符');
    }
  }

  /**
   * 验证颜色值（Hex 格式）
   *
   * @param color - 颜色值
   * @throws Error - 如果颜色格式无效
   */
  validateColor(color: string | null | undefined): void {
    if (!color) return;

    const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexPattern.test(color)) {
      throw new Error('颜色必须是有效的 Hex 格式（例如 #FF5733）');
    }
  }

  /**
   * 检查文件夹是否可以删除
   *
   * @param folder - 文件夹聚合根
   * @throws Error - 如果文件夹不能删除
   */
  validateFolderDeletion(folder: GoalFolder): void {
    // 系统文件夹不能删除
    if (folder.isSystemFolder) {
      throw new Error('系统文件夹不能删除');
    }

    // 已删除的文件夹不能再次删除
    if (folder.deletedAt !== null) {
      throw new Error('文件夹已被删除');
    }
  }

  /**
   * 检查是否存在同名文件夹
   *
   * @param newName - 新文件夹名称
   * @param accountUuid - 账户 UUID
   * @param existingFolders - 现有文件夹列表
   * @param excludeFolderUuid - 要排除的文件夹 UUID（更新时使用）
   * @throws Error - 如果存在同名文件夹
   */
  checkDuplicateName(
    newName: string,
    accountUuid: string,
    existingFolders: GoalFolder[],
    excludeFolderUuid?: string,
  ): void {
    const trimmedName = newName.trim().toLowerCase();

    const duplicate = existingFolders.find((folder) => {
      // 排除指定的文件夹（更新时）
      if (excludeFolderUuid && folder.uuid === excludeFolderUuid) {
        return false;
      }

      // 排除已删除的文件夹
      if (folder.deletedAt !== null) {
        return false;
      }

      // 检查同账户下的同名文件夹
      return folder.accountUuid === accountUuid && folder.name.trim().toLowerCase() === trimmedName;
    });

    if (duplicate) {
      throw new Error(`文件夹"${newName}"已存在`);
    }
  }

  /**
   * 验证父文件夹
   *
   * @param parentFolder - 父文件夹聚合根
   * @param accountUuid - 当前账户 UUID
   * @throws Error - 如果父文件夹无效
   */
  validateParentFolder(parentFolder: GoalFolder | null, accountUuid: string): void {
    if (!parentFolder) return;

    // 检查父文件夹是否属于同一账户
    if (parentFolder.accountUuid !== accountUuid) {
      throw new Error('无权访问此父文件夹');
    }

    // 父文件夹不能是系统文件夹
    if (parentFolder.isSystemFolder) {
      throw new Error('不能在系统文件夹下创建子文件夹');
    }

    // 父文件夹不能是已删除的文件夹
    if (parentFolder.deletedAt !== null) {
      throw new Error('父文件夹已被删除');
    }
  }

  /**
   * 计算文件夹的嵌套层级
   *
   * @param folder - 当前文件夹
   * @param allFolders - 所有文件夹列表
   * @returns 嵌套层级（根文件夹为 0）
   */
  calculateFolderDepth(folder: GoalFolder, allFolders: GoalFolder[]): number {
    let depth = 0;
    let currentFolder = folder;

    // 最多追踪 10 层，防止循环引用
    const maxDepth = 10;

    while (currentFolder.parentFolderUuid && depth < maxDepth) {
      const parentFolder = allFolders.find((f) => f.uuid === currentFolder.parentFolderUuid);

      if (!parentFolder) break;

      depth++;
      currentFolder = parentFolder;
    }

    return depth;
  }

  /**
   * 验证文件夹嵌套深度
   *
   * @param folder - 文件夹聚合根
   * @param allFolders - 所有文件夹列表
   * @param maxDepth - 最大允许深度（默认 3）
   * @throws Error - 如果超过最大深度
   */
  validateFolderDepth(folder: GoalFolder, allFolders: GoalFolder[], maxDepth: number = 3): void {
    const depth = this.calculateFolderDepth(folder, allFolders);

    if (depth >= maxDepth) {
      throw new Error(`文件夹嵌套不能超过 ${maxDepth} 层`);
    }
  }

  /**
   * 检查目标是否可以移动到文件夹
   *
   * @param goal - 目标聚合根
   * @param folder - 目标文件夹（null 表示移至根目录）
   * @throws Error - 如果不能移动
   */
  validateGoalMove(goal: Goal, folder: GoalFolder | null): void {
    // 如果是移至根目录（全部目标），无需验证
    if (!folder) return;

    // 文件夹不能是系统文件夹（除了 ALL）
    if (folder.isSystemFolder) {
      throw new Error('不能将目标移动到系统筛选文件夹');
    }

    // 文件夹不能是已删除的
    if (folder.deletedAt !== null) {
      throw new Error('不能将目标移动到已删除的文件夹');
    }

    // 目标和文件夹必须属于同一账户
    if (goal.accountUuid !== folder.accountUuid) {
      throw new Error('目标和文件夹不属于同一账户');
    }
  }

  /**
   * 批量移动目标到文件夹（验证）
   *
   * @param goals - 目标列表
   * @param folder - 目标文件夹
   * @param accountUuid - 账户 UUID
   * @throws Error - 如果有任何目标不能移动
   */
  validateBatchGoalMove(goals: Goal[], folder: GoalFolder | null, accountUuid: string): void {
    // 检查所有目标是否属于该账户
    const invalidGoals = goals.filter((g) => g.accountUuid !== accountUuid);
    if (invalidGoals.length > 0) {
      throw new Error('部分目标不属于当前账户');
    }

    // 如果有目标文件夹，验证文件夹
    if (folder) {
      if (folder.accountUuid !== accountUuid) {
        throw new Error('文件夹不属于当前账户');
      }

      if (folder.isSystemFolder) {
        throw new Error('不能批量移动到系统筛选文件夹');
      }

      if (folder.deletedAt !== null) {
        throw new Error('不能移动到已删除的文件夹');
      }
    }
  }

  /**
   * 计算文件夹统计信息
   *
   * @param folder - 文件夹聚合根
   * @param goalsInFolder - 文件夹中的目标列表
   * @returns { goalCount, completedGoalCount }
   */
  calculateFolderStatistics(
    folder: GoalFolder,
    goalsInFolder: Goal[],
  ): { goalCount: number; completedGoalCount: number } {
    const goalCount = goalsInFolder.length;
    const completedGoalCount = goalsInFolder.filter((g) => g.status === 'COMPLETED').length;

    return { goalCount, completedGoalCount };
  }

  /**
   * 更新文件夹统计信息
   *
   * @param folder - 文件夹聚合根
   * @param goalsInFolder - 文件夹中的目标列表
   */
  updateFolderStatistics(folder: GoalFolder, goalsInFolder: Goal[]): void {
    const { goalCount, completedGoalCount } = this.calculateFolderStatistics(folder, goalsInFolder);

    folder.updateStatistics(goalCount, completedGoalCount);
  }
}
