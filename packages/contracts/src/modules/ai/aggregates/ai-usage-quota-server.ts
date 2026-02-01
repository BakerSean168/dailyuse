/**
 * AIUsageQuota Aggregate Root - Server Interface
 * AI使用配额聚合根 - 服务端接口
 */

import type { QuotaResetPeriod } from '../value-objects/quota-reset-period';
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
}
