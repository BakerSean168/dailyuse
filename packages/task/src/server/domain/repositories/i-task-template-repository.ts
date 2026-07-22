/**
 * TaskTemplate 仓储接口 (Server)
 * 任务模板聚合根仓储
 *
 * DDD 仓储职责：
 * - 聚合根的持久化（保存、查询、删除）
 * - 提供丰富的查询接口
 * - 是基础设施层的抽象
 */

import type { TaskTemplate } from '../aggregates';
import type { TaskTemplateStatus } from '@dailyuse/contracts/task';

/**
 * 任务查询过滤器
 */
export interface TaskFilters {
  status?: string;
  goalId?: string;
  parentTaskId?: string;
  isBlocked?: boolean;
  tags?: string[];
  folderId?: string;
  dueDateFrom?: number;
  dueDateTo?: number;
  limit?: number;
  offset?: number;
}

/**
 * TaskTemplate 仓储接口
 */
export interface ITaskTemplateRepository {
  /**
   * 保存任务模板（创建或更新）
   */
  save(template: TaskTemplate): Promise<void>;

  /**
   * 根据 ID 查找任务模板
   */
  findById(id: string): Promise<TaskTemplate | null>;

  /**
   * 根据 ID + identity 查找任务模板
   */
  findByIdForIdentity(identityId: string, id: string): Promise<TaskTemplate | null>;

  /**
   * 根据 ID 查找任务模板（包含子实体：子任务、实例）
   */
  findByIdWithChildren(id: string): Promise<TaskTemplate | null>;

  /**
   * 根据 ID + identity 查找任务模板（含子集）
   */
  findByIdWithChildrenForIdentity(
    identityId: string,
    id: string,
  ): Promise<TaskTemplate | null>;

  /**
   * 根据用户 ID 查找所有任务模板
   */
  findByIdentityId(identityId: string): Promise<TaskTemplate[]>;

  /**
   * 根据状态查找任务模板
   */
  findByStatus(identityId: string, status: TaskTemplateStatus): Promise<TaskTemplate[]>;

  /**
   * 查找活跃的任务模板
   */
  findActiveTemplates(identityId: string): Promise<TaskTemplate[]>;

  /**
   * 根据文件夹查找任务模板（identity-scoped）
   */
  findByFolderId(identityId: string, folderId: string): Promise<TaskTemplate[]>;

  /**
   * 根据目标查找任务模板（identity-scoped）
   */
  findByGoalId(identityId: string, goalId: string): Promise<TaskTemplate[]>;

  /**
   * 根据标签查找任务模板
   */
  findByTags(identityId: string, tags: string[]): Promise<TaskTemplate[]>;

  /**
   * 查找需要生成实例的模板（供定时任务使用）
   */
  findNeedGenerateInstances(toDate: number): Promise<TaskTemplate[]>;

  /**
   * 硬删除任务模板（identity-scoped）
   */
  delete(identityId: string, id: string): Promise<void>;

  /**
   * 软删除任务模板
   */
  softDelete(identityId: string, id: string): Promise<void>;

  /**
   * 恢复软删除的任务模板
   */
  restore(identityId: string, id: string): Promise<void>;

  // ===== 任务类型查询 =====

  /**
   * 查找一次性任务（带过滤器）
   */
  findOneTimeTasks(identityId: string, filters?: TaskFilters): Promise<TaskTemplate[]>;

  /**
   * 查找循环任务（带过滤器）
   */
  findRecurringTasks(identityId: string, filters?: TaskFilters): Promise<TaskTemplate[]>;

  /**
   * 查找逾期的任务
   */
  findOverdueTasks(identityId: string): Promise<TaskTemplate[]>;

  /**
   * 根据关键结果查找任务（identity-scoped）
   */
  findByKeyResultId(identityId: string, keyResultId: string): Promise<TaskTemplate[]>;

  /**
   * 查找子任务（identity-scoped）
   */
  findSubtasks(identityId: string, parentTaskId: string): Promise<TaskTemplate[]>;

  /**
   * 查找被阻塞的任务
   */
  findBlockedTasks(identityId: string): Promise<TaskTemplate[]>;

  /**
   * 按优先级排序查找任务
   */
  findSortedByPriority(identityId: string, limit?: number): Promise<TaskTemplate[]>;

  /**
   * 查找即将到期的任务（未来N天内）
   */
  findUpcomingTasks(identityId: string, daysAhead: number): Promise<TaskTemplate[]>;

  /**
   * 查找今日任务
   */
  findTodayTasks(identityId: string): Promise<TaskTemplate[]>;

  /**
   * 统计任务数量（按条件）
   */
  countTasks(identityId: string, filters?: TaskFilters): Promise<number>;

  /**
   * 批量保存任务
   */
  saveBatch(templates: TaskTemplate[]): Promise<void>;

  /**
   * 批量删除任务
   */
  deleteBatch(identityId: string, ids: string[]): Promise<void>;
}