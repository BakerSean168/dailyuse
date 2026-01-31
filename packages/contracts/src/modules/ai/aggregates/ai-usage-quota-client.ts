/**
 * AIUsageQuota Aggregate Root - Client Interface
 * AI使用配额聚合�?- 客户端接�?
 */

import type { AiUsageQuotaId, IdentityId, TransferDate, DomainDate } from '@/primitives';
import type { QuotaResetPeriod } from '../value-objects/quota-reset-period';

// ============ DTO 定义 ============

/**
 * AIUsageQuota Client DTO
 */
export interface AIUsageQuotaClientDTO {
  id: string;
  identityId: string;
  quotaLimit: number;
  currentUsage: number;
  resetPeriod: QuotaResetPeriod;
  lastResetAt: TransferDate;
  nextResetAt: TransferDate;
  createdAt: TransferDate;
  updatedAt: TransferDate;

  // UI 计算字段
  remainingQuota: number;
  usagePercentage: number;
  isExceeded: boolean;
  formattedResetPeriod: string;
}

// ============ 实体接口 ============

/**
 * AIUsageQuota 聚合�?- Client 接口（实例方法）
 */
export interface AIUsageQuotaClient {
  id: AiUsageQuotaId;
  identityId: IdentityId;
  quotaLimit: number;
  currentUsage: number;
  resetPeriod: QuotaResetPeriod;
  lastResetAt: DomainDate;
  nextResetAt: DomainDate;
  createdAt: DomainDate;
  updatedAt: DomainDate;

  // ===== 计算属性方�?=====

  /**
   * 获取剩余配额
   */
  getRemainingQuota(): number;

  /**
   * 获取使用率（百分比）
   */
  getUsagePercentage(): number;

  /**
   * 检查是否已超限
   */
  isQuotaExceeded(): boolean;

  /**
   * 获取格式化的重置周期文本
   */
  getFormattedResetPeriod(): string;

}

/**
 * AIUsageQuota 静态工厂方法接�?
 */
