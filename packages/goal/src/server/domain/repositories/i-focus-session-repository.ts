/**
 * FocusSession 聚合根仓储接口
 *
 * DDD 仓储模式：
 * - 只定义接口，不实现具体逻辑
 * - 由基础设施层（Prisma / SQLite）实现
 * - 使用依赖注入
 * - 隐藏数据访问细节
 */

import type { FocusSession } from '../aggregates/focus-session';
import type { FocusSessionStatus } from '@dailyuse/contracts/goal';

/**
 * IFocusSessionRepository 仓储接口
 *
 * 职责：
 * - FocusSession 聚合根的持久化操作
 * - 聚合根是操作的基本单位
 * - 提供专注会话特定的查询方法
 */
export interface IFocusSessionRepository {
  /**
   * 保存聚合根（创建或更新）
   *
   * @param session - FocusSession 聚合根
   */
  save(session: FocusSession): Promise<void>;

  /**
   * 通过 ID + identity 查找聚合根（唯一读路径）
   */
  findByIdForIdentity(identityId: string, id: string): Promise<FocusSession | null>;

  /**
   * 查找用户的活跃会话
   *
   * 业务规则：每个用户同时只能有一个活跃会话（Active 或 Paused）
   *
   * @param identityId - 用户身份 ID
   * @returns 活跃会话，不存在则返回 null
   */
  findActiveSession(identityId: string): Promise<FocusSession | null>;

  /**
   * 通过 identityId 查找所有会话
   *
   * @param identityId - 用户身份 ID
   * @param options - 查询选项
   * @param options.goalId - 过滤关联的目标
   * @param options.status - 过滤状态（可以是多个状态）
   * @param options.limit - 返回数量限制（默认 50）
   * @param options.offset - 偏移量（分页）
   * @param options.orderBy - 排序字段（默认 'createdAt'）
   * @param options.orderDirection - 排序方向（默认 'desc'）
   * @returns 会话列表
   */
  findByIdentityId(
    identityId: string,
    options?: {
      goalId?: string | null;
      status?: FocusSessionStatus[];
      limit?: number;
      offset?: number;
      orderBy?: 'createdAt' | 'startedAt' | 'completedAt' | 'updatedAt';
      orderDirection?: 'asc' | 'desc';
    },
  ): Promise<FocusSession[]>;

  /**
   * 通过目标 ID 查找所有会话（identity-scoped）
   *
   * @param identityId - 用户身份 ID
   * @param goalId - 目标 ID
   * @param options - 查询选项
   * @returns 会话列表
   */
  findByGoalId(
    identityId: string,
    goalId: string,
    options?: {
      status?: FocusSessionStatus[];
      limit?: number;
      offset?: number;
    },
  ): Promise<FocusSession[]>;

  /**
   * 删除会话（物理删除，必须同时匹配 identity）
   *
   * @param identityId - 用户身份 ID
   * @param id - 会话 ID
   */
  delete(identityId: string, id: string): Promise<void>;

  /**
   * 检查会话是否存在（identity-scoped）
   *
   * @param identityId - 用户身份 ID
   * @param id - 会话 ID
   */
  exists(identityId: string, id: string): Promise<boolean>;

  /**
   * 统计用户的会话数量
   *
   * @param identityId - 用户身份 ID
   * @param options - 统计选项
   * @param options.status - 过滤状态
   * @param options.startDate - 开始日期（时间戳）
   * @param options.endDate - 结束日期（时间戳）
   * @returns 会话数量
   */
  count(
    identityId: string,
    options?: {
      status?: FocusSessionStatus[];
      startDate?: number;
      endDate?: number;
    },
  ): Promise<number>;
}
