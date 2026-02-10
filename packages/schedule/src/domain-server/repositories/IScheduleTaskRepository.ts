/**
 * IScheduleTaskRepository - Repository Interface
 * ScheduleTask 仓储接口
 *
 * DDD Repository Pattern:
 * - 抽象聚合根的持久化逻辑
 * - 提供类集合的操作接口
 * - 面向领域模型，而非数据库表
 *
 * @domain-server/schedule
 */

import type { ScheduleTask } from '../aggregates/schedule-task';
import { ScheduleTaskStatus, SourceModule } from '@dailyuse/contracts/schedule';

/**
 * ScheduleTask 查询选项
 */
export interface IScheduleTaskQueryOptions {
  accountUuid?: string;
  sourceModule?: SourceModule;
  sourceEntityId?: string;
  status?: ScheduleTaskStatus;
  isEnabled?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * ScheduleTask 仓储接口
 */
export interface IScheduleTaskRepository {
  // ============ 基本 CRUD ============

  /**
   * 保存 ScheduleTask 聚合根
   * - 新建: INSERT
   * - 更新: UPDATE (基于版本号进行乐观锁)
   */
  save(task: ScheduleTask): Promise<void>;

  /**
   * 根据 UUID 查找 ScheduleTask
   */
  findByUuid(uuid: string): Promise<ScheduleTask | null>;

  /**
   * 根据 UUID 删除 ScheduleTask
   */
  deleteByUuid(uuid: string): Promise<void>;

  // ============ 查询方法 ============

  /**
   * 查询账户下的所有任务
   */
  findByAccountUuid(accountUuid: string): Promise<ScheduleTask[]>;

  /**
   * 查询指定来源模块的所有任务
   */
  findBySourceModule(module: SourceModule, accountUuid?: string): Promise<ScheduleTask[]>;

  /**
   * 查询指定来源实体的任务
   */
  findBySourceEntity(
    module: SourceModule,
    entityId: string,
    accountUuid?: string,
  ): Promise<ScheduleTask[]>;

  /**
   * 查询指定状态的任务
   */
  findByStatus(status: ScheduleTaskStatus, accountUuid?: string): Promise<ScheduleTask[]>;

  /**
   * 查询启用的任务
   */
  findEnabled(accountUuid?: string): Promise<ScheduleTask[]>;

  /**
   * 查询需要执行的任务 (到时间 + 已启用 + 活跃状态)
   */
  findDueTasksForExecution(beforeTime: Date, limit?: number): Promise<ScheduleTask[]>;

  /**
   * 高级查询
   */
  query(options: IScheduleTaskQueryOptions): Promise<ScheduleTask[]>;

  /**
   * 计数查询
   */
  count(options: IScheduleTaskQueryOptions): Promise<number>;

  // ============ 批量操作 ============

  /**
   * 批量保存
   */
  saveBatch(tasks: ScheduleTask[]): Promise<void>;

  /**
   * 批量删除
   */
  deleteBatch(uuids: string[]): Promise<void>;

  // ============ 事务支持 ============

  /**
   * 在事务中执行操作
   */
  withTransaction<T>(fn: (repo: IScheduleTaskRepository) => Promise<T>): Promise<T>;
}
