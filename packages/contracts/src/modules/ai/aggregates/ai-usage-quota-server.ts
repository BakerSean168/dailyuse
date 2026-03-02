/**
 * AIUsageQuota Aggregate Root - Server Interface
 * AI使用配额聚合根 - 服务端接口
 */

import type { AiUsageQuotaId, IdentityId, TransferDate, DomainDate, PersistenceDate } from '../../../primitives';
import type { QuotaResetPeriod } from '../value-objects/quota-reset-period';

// ============ DTO 定义 ============

/**
 * AIUsageQuota Server DTO（应用层）
 * 使用 TransferDate (number) 时间戳
 */
export interface AIUsageQuotaServerDTO {
  id: AiUsageQuotaId;
  identityId: IdentityId;
  quotaLimit: number;
  currentUsage: number;
  resetPeriod: QuotaResetPeriod;
  lastResetAt: TransferDate;
  nextResetAt: TransferDate;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * AIUsageQuota Persistence DTO（数据库层）
 * 使用 PersistenceDate (Date 对象)
 */
export interface AIUsageQuotaPersistenceDTO {
  id: AiUsageQuotaId;
  identityId: IdentityId;
  quotaLimit: number;
  currentUsage: number;
  resetPeriod: QuotaResetPeriod;
  lastResetAt: PersistenceDate;
  nextResetAt: PersistenceDate;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}

// ============ 领域事件 ============

/**
 * 配额创建事件
 */
export interface AIUsageQuotaCreatedEvent {
  type: 'ai_usage_quota.created';
  aggregateId: AiUsageQuotaId;
  timestamp: DomainDate;
  payload: {
    quota: AIUsageQuotaServerDTO;
    identityId: IdentityId;
  };
}

/**
 * 配额使用事件
 */
export interface AIUsageQuotaConsumedEvent {
  type: 'ai_usage_quota.consumed';
  aggregateId: AiUsageQuotaId;
  timestamp: DomainDate;
  payload: {
    quotaId: AiUsageQuotaId;
    identityId: IdentityId;
    amount: number;
    previousUsage: number;
    newUsage: number;
    consumedAt: TransferDate;
  };
}

/**
 * 配额重置事件
 */
export interface AIUsageQuotaResetEvent {
  type: 'ai_usage_quota.reset';
  aggregateId: AiUsageQuotaId;
  timestamp: DomainDate;
  payload: {
    quotaId: AiUsageQuotaId;
    identityId: IdentityId;
    previousUsage: number;
    resetAt: TransferDate;
    nextResetAt: TransferDate;
  };
}

/**
 * 配额超限事件
 */
export interface AIUsageQuotaExceededEvent {
  type: 'ai_usage_quota.exceeded';
  aggregateId: AiUsageQuotaId;
  timestamp: DomainDate;
  payload: {
    quotaId: AiUsageQuotaId;
    identityId: IdentityId;
    quotaLimit: number;
    currentUsage: number;
    exceededAt: TransferDate;
  };
}

/**
 * 配额限制更新事件
 */
export interface AIUsageQuotaLimitUpdatedEvent {
  type: 'ai_usage_quota.limit_updated';
  aggregateId: AiUsageQuotaId;
  timestamp: DomainDate;
  payload: {
    quotaId: AiUsageQuotaId;
    previousLimit: number;
    newLimit: number;
    updatedAt: DomainDate;
  };
}
