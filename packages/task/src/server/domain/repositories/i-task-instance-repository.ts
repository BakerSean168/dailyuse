/**
 * TaskInstance 仓储接口 (Server)
 * 任务实例聚合根仓储
 *
 * DDD 仓储职责：
 * - 聚合根的持久化
 * - 聚合根的查询
 * - 是基础设施层的抽象
 */

import type { TaskInstance } from '../aggregates';
import type { TaskInstanceStatus } from '@memoflow/contracts/task';

export interface TaskTemplateInstanceStats {
  templateId: string;
  instanceCount: number;
  completedInstanceCount: number;
  pendingInstanceCount: number;
  completionRate: number;
}

/**
 * TaskInstance 仓储接口
 */
export interface ITaskInstanceRepository {
  /**
   * 保存任务实例
   */
  save(instance: TaskInstance): Promise<void>;

  /**
   * 批量保存任务实例
   */
  saveMany(instances: TaskInstance[]): Promise<void>;

  /**
   * 根据 ID + identity 查找任务实例（唯一授权敏感读路径）
   */
  findByIdForIdentity(identityId: string, id: string): Promise<TaskInstance | null>;

  /**
   * 根据模板 ID + identity 查找任务实例
   */
  findByTemplateId(templateId: string, identityId: string): Promise<TaskInstance[]>;

  /**
   * 根据用户 ID 查找任务实例
   */
  findByIdentityId(identityId: string): Promise<TaskInstance[]>;

  /**
   * 根据日期范围查找任务实例
   */
  findByDateRange(identityId: string, startDate: number, endDate: number): Promise<TaskInstance[]>;

  /**
   * 根据状态查找任务实例
   */
  findByStatus(identityId: string, status: TaskInstanceStatus): Promise<TaskInstance[]>;

  /**
   * 查找过期的任务实例
   */
  findOverdueInstances(identityId: string): Promise<TaskInstance[]>;

  /**
   * 删除任务实例（identity-scoped）
   */
  delete(identityId: string, id: string): Promise<void>;

  /**
   * 批量删除任务实例
   */
  deleteMany(identityId: string, ids: string[]): Promise<void>;

  /**
   * 删除模板的所有任务实例
   */
  deleteByTemplateId(templateId: string, identityId: string): Promise<void>;

  /**
   * 统计模板的未过期实例数量
   * @param templateId 模板 ID
   * @param fromDate 起始日期时间戳（默认为当前时间）
   */
  countFutureInstances(
    templateId: string,
    identityId: string,
    fromDate?: number,
  ): Promise<number>;

  /**
   * 根据模板 ID 和日期范围查找任务实例
   */
  findByTemplateIdAndDateRange(
    templateId: string,
    identityId: string,
    startDate: number,
    endDate: number,
  ): Promise<TaskInstance[]>;

  /**
   * 批量统计模板实例聚合数据
   */
  getTemplateStats(
    templateIds: string[],
    identityId: string,
  ): Promise<Record<string, TaskTemplateInstanceStats>>;

  /**
   * 删除模板从指定时点开始的未完成实例
   * 用于暂停模板时清理当前及未来无意义的实例
   */
  deleteIncompleteInstancesFrom(
    templateId: string,
    identityId: string,
    fromDate: number,
  ): Promise<number>;
}
