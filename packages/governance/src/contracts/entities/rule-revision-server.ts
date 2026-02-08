/**
 * RuleRevision Entity - Server Interface
 * 规则修订记录实体 - 服务端接口
 *
 * Server 端的修订记录包含完整的审计信息：
 * - 完整的变更详情
 * - 数据库持久化映射
 * - 内部实现细节
 */

import type { TransferDate } from '@dailyuse/contracts/shared';
import type { RuleId } from '../value-objects';

// ============ 实体接口 ============

/**
 * Server 端规则修订记录
 * 
 * 包含完整的审计信息，用于：
 * - 追踪规则变更历史
 * - 支持变更回滚
 * - 审计合规要求
 */
export interface RuleRevisionServer {
  /**
   * 修订记录 ID
   */
  id: string;

  /**
   * 关联的规则 ID
   */
  ruleId: RuleId;

  /**
   * 修订版本号（从 1 开始递增）
   */
  revisionNumber: number;

  /**
   * 修改人 ID
   */
  authorId: string;

  /**
   * 变更的字段列表
   */
  changedFields: readonly string[];

  /**
   * 修改前的值（完整记录）
   */
  previousValues: Record<string, unknown>;

  /**
   * 修改后的值（完整记录）
   */
  newValues: Record<string, unknown>;

  /**
   * 变更类型
   */
  changeType: 'Created' | 'Updated' | 'Deprecated' | 'Reactivated';

  /**
   * 创建时间
   */
  createdAt: Date;
}

// ============ DTO 定义 ============

/**
 * Server DTO (Internal)
 * 服务端内部使用的数据结构
 */
export interface RuleRevisionServerDTO {
  id: string;
  ruleId: RuleId;
  revisionNumber: number;
  authorId: string;
  changedFields: string[];
  previousValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  changeType: 'Created' | 'Updated' | 'Deprecated' | 'Reactivated';
  createdAt: TransferDate;
}

/**
 * Persistence DTO (Database)
 * 数据库持久化使用的数据结构
 * 
 * - changedFields, previousValues, newValues 存储为 JSON 字符串
 * - createdAt 存储为 Date 对象
 */
export interface RuleRevisionPersistenceDTO {
  id: string;
  ruleId: string;
  revisionNumber: number;
  authorId: string;
  changedFields: string; // JSON array
  previousValues: string | null; // JSON object
  newValues: string | null; // JSON object
  changeType: string;
  createdAt: Date;
}
