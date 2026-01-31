/**
 * AIUsageQuota Aggregate Root - Server Interface
 * AI使用配额聚合根 - 服务端接口
 */

import type { QuotaResetPeriod } from '../enums';
import type { AIUsageQuotaClientDTO } from './ai-usage-quota-client';

// ============ DTO 定义 ============

/**
 * AIUsageQuota Server DTO（应用层）
 */
export interface AIUsageQuotaServerDTO {
  uuid: string;
  accountUuid: string;
  quotaLimit: number;
  currentUsage: number;
  resetPeriod: QuotaResetPeriod;
  lastResetAt: number;
  nextResetAt: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * AIUsageQuota Persistence DTO（数据库层）
 * 注意：使用 camelCase 命名，与数据库 snake_case 的映射在仓储层处理
 */
export interface AIUsageQuotaPersistenceDTO {
  uuid: string;
  accountUuid: string;
  quotaLimit: number;
  currentUsage: number;
  resetPeriod: QuotaResetPeriod;
  lastResetAt: number;
  nextResetAt: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============ 领域事件 ============

/**
 * 配额创建事件
 */
export interface AIUsageQuotaCreatedEvent {
  type: 'ai_usage_quota.created';
  aggregateId: string; // quotaUuid
  timestamp: Date;
  payload: {
    quota: AIUsageQuotaServerDTO;
    accountUuid: string;
  };
}

/**
 * 配额使用事件
 */
export interface AIUsageQuotaConsumedEvent {
  type: 'ai_usage_quota.consumed';
  aggregateId: string;
  timestamp: Date;
  payload: {
    quotaUuid: string;
    accountUuid: string;
    amount: number;
    previousUsage: number;
    newUsage: number;
    consumedAt: number;
  };
}

/**
 * 配额重置事件
 */
export interface AIUsageQuotaResetEvent {
  type: 'ai_usage_quota.reset';
  aggregateId: string;
  timestamp: Date;
  payload: {
    quotaUuid: string;
    accountUuid: string;
    previousUsage: number;
    resetAt: number;
    nextResetAt: number;
  };
}

/**
 * 配额超限事件
 */
export interface AIUsageQuotaExceededEvent {
  type: 'ai_usage_quota.exceeded';
  aggregateId: string;
  timestamp: Date;
  payload: {
    quotaUuid: string;
    accountUuid: string;
    quotaLimit: number;
    currentUsage: number;
    exceededAt: number;
  };
}

/**
 * 配额限制更新事件
 */
export interface AIUsageQuotaLimitUpdatedEvent {
  type: 'ai_usage_quota.limit_updated';
  aggregateId: string;
  timestamp: Date;
  payload: {
    quotaUuid: string;
    previousLimit: number;
    newLimit: number;
    updatedAt: Date;
  };
}

// ============ 实体接口 ============

/**
 * AIUsageQuota 聚合根 - Server 接口（实例方法）
 */
export interface AIUsageQuotaServer {
  // 基础属性
  uuid: string;
  accountUuid: string;
  quotaLimit: number;
  currentUsage: number;
  resetPeriod: QuotaResetPeriod;
  lastResetAt: number;
  nextResetAt: number;
  createdAt: Date;
  updatedAt: Date;

  // ===== 配额管理方法 =====

  /**
   * 消耗配额
   * @param amount 消耗数量
   * @returns 是否成功消耗
   */

  /**
   * 检查是否可以消耗指定数量
   * @param amount 要消耗的数量
   * @returns 是否可以消耗
   */

  /**
   * 获取剩余配额
   */

  /**
   * 检查是否已超限
   */

  /**
   * 检查是否需要重置
   */

  /**
   * 重置配额
   */

  /**
   * 更新配额限制
   */

  /**
   * 计算下次重置时间
   */

  /**
   * 获取使用率（百分比）
   */

  // ===== 转换方法 (To) =====
  /**
   * 转换为 Client DTO
   */

  /**
   * 转换为 Persistence DTO
   */
}
