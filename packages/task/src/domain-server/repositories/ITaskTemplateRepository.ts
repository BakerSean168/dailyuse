/**
 * TaskTemplate 仓储接口 (Server)
 * 任务模板仓储
 */

import { TaskTemplate } from '../aggregates';
import { TaskInstanceStatus, TaskTemplateStatus } from '@dailyuse/contracts/task';

// Local type definition (not yet in contracts)
type TaskType = 'Standard' | 'Recurring' | 'Checklist';

/**
 * 任务查询过滤器
 */
export interface TaskFilters {
  taskType?: TaskType;
  status?: TaskInstanceStatus | TaskTemplateStatus;
  goalUuid?: string;
  parentTaskUuid?: string;
  isBlocked?: boolean;
  tags?: string[];
  folderUuid?: string;
  dueDateFrom?: number;
  dueDateTo?: number;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  limit?: number;
  offset?: number;
}

/**
 * TaskTemplate 仓储接口
 *
 * DDD 仓储职责：
 * - 聚合根的持久化
 * - 聚合根的查询
 * - 是基础设施层的抽象
 */
export interface ITaskTemplateRepository {
  /**
   * 保存任务模板
   */
  save(template: TaskTemplate): Promise<void>;

  /**
   * 根据 UUID 查找任务模板
   */
  findByUuid(uuid: string): Promise<TaskTemplate | null>;

  /**
   * 根据 UUID 查找任务模板（包含子实体）
   */
  findByUuidWithChildren(uuid: string): Promise<TaskTemplate | null>;

  /**
   * 根据账户 UUID 查找任务模板
   */
  findByAccount(accountUuid: string): Promise<TaskTemplate[]>;

  /**
   * 根据状态查找任务模板
   */
  findByStatus(accountUuid: string, status: TaskTemplateStatus): Promise<TaskTemplate[]>;

  /**
   * 查找活跃的任务模板
   */
  findActiveTemplates(accountUuid: string): Promise<TaskTemplate[]>;

  /**
   * 根据文件夹查找任务模板
   */
  findByFolder(folderUuid: string): Promise<TaskTemplate[]>;

  /**
   * 根据目标查找任务模板
   */
  findByGoal(goalUuid: string): Promise<TaskTemplate[]>;

  /**
   * 根据标签查找任务模板
   */
  findByTags(accountUuid: string, tags: string[]): Promise<TaskTemplate[]>;

  /**
   * 查找需要生成实例的模板
   */
  findNeedGenerateInstances(toDate: number): Promise<TaskTemplate[]>;

  /**
   * 删除任务模板
   */
  delete(uuid: string): Promise<void>;

  /**
   * 软删除任务模板
   */
  softDelete(uuid: string): Promise<void>;

  /**
   * 恢复任务模板
   */
  restore(uuid: string): Promise<void>;

  // ===== ONE_TIME 任务查询方法 =====

  /**
   * 查找一次性任务（带过滤器）
   */
  findOneTimeTasks(accountUuid: string, filters?: TaskFilters): Promise<TaskTemplate[]>;

  /**
   * 查找循环任务（带过滤器）
   */
  findRecurringTasks(accountUuid: string, filters?: TaskFilters): Promise<TaskTemplate[]>;

  /**
   * 查找逾期的任务
   */
  findOverdueTasks(accountUuid: string): Promise<TaskTemplate[]>;

  /**
   * 根据目标查找任务（新版本 - 支持 goalUuid 字段）
   */
  findTasksByGoal(goalUuid: string): Promise<TaskTemplate[]>;

  /**
   * 根据关键结果查找任务
   */
  findTasksByKeyResult(keyResultUuid: string): Promise<TaskTemplate[]>;

  /**
   * 查找子任务
   */
  findSubtasks(parentTaskUuid: string): Promise<TaskTemplate[]>;

  /**
   * 查找被阻塞的任务
   */
  findBlockedTasks(accountUuid: string): Promise<TaskTemplate[]>;

  /**
   * 按优先级排序查找任务
   */
  findTasksSortedByPriority(accountUuid: string, limit?: number): Promise<TaskTemplate[]>;

  /**
   * 查找即将到期的任务（未来N天内）
   */
  findUpcomingTasks(accountUuid: string, daysAhead: number): Promise<TaskTemplate[]>;

  /**
   * 查找今日任务
   */
  findTodayTasks(accountUuid: string): Promise<TaskTemplate[]>;

  /**
   * 统计任务数量（按条件）
   */
  countTasks(accountUuid: string, filters?: TaskFilters): Promise<number>;

  /**
   * 批量保存任务
   */
  saveBatch(templates: TaskTemplate[]): Promise<void>;

  /**
   * 批量删除任务
   */
  deleteBatch(uuids: string[]): Promise<void>;
}
