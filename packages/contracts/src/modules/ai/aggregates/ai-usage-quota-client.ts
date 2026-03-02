/**
 * AIUsageQuota Aggregate Root - Client Interface
 * AI使用配额聚合�?- 客户端接�?
 */

import type { AiUsageQuotaId, IdentityId, TransferDate, DomainDate } from '../../../primitives';
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
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;

  // UI 计算字段
  remainingQuota: number;
  usagePercentage: number;
  isExceeded: boolean;
  formattedResetPeriod: string;
}

/**
 * AIUsageQuota 静态工厂方法接�?
 */
