/**
 * FocusSession 仓储接口
 *
 * DDD 仓储模式：
 * - 只定义接口，不实现具体逻辑
 * - 由基础设施层（Infrastructure Layer）实现
 * - 使用依赖注入
 * - 隐藏数据访问细节
 *
 * 职责：
 * - 定义持久化操作的契约
 * - 聚合根是操作的基本单位
 * - 提供专注周期特定的查询方法
 */

import type { FocusSession } from '../aggregates/focus-session';
import type { FocusSessionStatus } from '@dailyuse/contracts/goal';

/**
 * IFocusSessionRepository 仓储接口
 */
export interface IFocusSessionRepository {
  /**
   * 保存聚合根（创建或更新）
   *
   * 注意：
   * - 这是事务操作
   * - 如果 UUID 已存在则更新，否则插入
   *
   * @param session - FocusSession 聚合根
   */
  save(session: FocusSession): Promise<void>;

  /**
   * 通过 UUID 查找聚合根
   *
   * @param uuid - 会话 UUID
   * @returns 聚合根实例，不存在则返回 null
   */
  findById(uuid: string): Promise<FocusSession | null>;

  /**
   * 查找账户的活跃会话
   *
   * 业务规则：每个账户同时只能有一个活跃会话（IN_PROGRESS 或 PAUSED）
   *
   * @param accountUuid - 账户 UUID
   * @returns 活跃会话，不存在则返回 null
   */
  findActiveSession(accountUuid: string): Promise<FocusSession | null>;

  /**
   * 通过账户 UUID 查找所有会话
   *
   * @param accountUuid - 账户 UUID
   * @param options - 查询选项
   * @param options.goalUuid - 过滤关联的目标
   * @param options.status - 过滤状态（可以是多个状态）
   * @param options.limit - 返回数量限制（默认 50）
   * @param options.offset - 偏移量（分页）
   * @param options.orderBy - 排序字段（默认 'createdAt'）
   * @param options.orderDirection - 排序方向（默认 'desc'）
   * @returns 会话列表
   */
  findByAccountUuid(
    accountUuid: string,
    options?: {
      goalUuid?: string | null;
      status?: FocusSessionStatus[];
      limit?: number;
      offset?: number;
      orderBy?: 'createdAt' | 'startedAt' | 'completedAt' | 'updatedAt';
      orderDirection?: 'asc' | 'desc';
    },
  ): Promise<FocusSession[]>;

  /**
   * 通过目标 UUID 查找所有会话
   *
   * @param goalUuid - 目标 UUID
   * @param options - 查询选项
   * @returns 会话列表
   */
  findByGoalUuid(
    goalUuid: string,
    options?: {
      status?: FocusSessionStatus[];
      limit?: number;
      offset?: number;
    },
  ): Promise<FocusSession[]>;

  /**
   * 删除会话（物理删除）
   *
   * 注意：这是永久删除操作
   *
   * @param uuid - 会话 UUID
   */
  delete(uuid: string): Promise<void>;

  /**
   * 检查会话是否存在
   *
   * @param uuid - 会话 UUID
   * @returns 是否存在
   */
  exists(uuid: string): Promise<boolean>;

  /**
   * 统计账户的会话数量
   *
   * @param accountUuid - 账户 UUID
   * @param options - 统计选项
   * @param options.status - 过滤状态
   * @param options.startDate - 开始日期（时间戳）
   * @param options.endDate - 结束日期（时间戳）
   * @returns 会话数量
   */
  count(
    accountUuid: string,
    options?: {
      status?: FocusSessionStatus[];
      startDate?: number;
      endDate?: number;
    },
  ): Promise<number>;
}
