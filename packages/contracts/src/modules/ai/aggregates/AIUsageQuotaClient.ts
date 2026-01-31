/**
 * AIUsageQuota Aggregate Root - Client Interface
 * AI使用配额聚合根 - 客户端接口
 */

import type { QuotaResetPeriod } from '../enums';

// ============ DTO 定义 ============

/**
 * AIUsageQuota Client DTO
 */
export interface AIUsageQuotaClientDTO {
  uuid: string;
  accountUuid: string;
  quotaLimit: number;
  currentUsage: number;
  resetPeriod: QuotaResetPeriod;
  lastResetAt: number;
  nextResetAt: number;
  createdAt: number;
  updatedAt: number;

  // UI 计算字段
  remainingQuota: number;
  usagePercentage: number;
  isExceeded: boolean;
  formattedResetPeriod: string;
}

// ============ 实体接口 ============

/**
 * AIUsageQuota 聚合根 - Client 接口（实例方法）
 */
export interface AIUsageQuotaClient {
  uuid: string;
  accountUuid: string;
  quotaLimit: number;
  currentUsage: number;
  resetPeriod: QuotaResetPeriod;
  lastResetAt: number;
  nextResetAt: number;
  createdAt: Date;
  updatedAt: Date;

  // ===== 计算属性方法 =====

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

  /**
   * 获取距离下次重置的时间（毫秒）
   */
  getTimeUntilReset(): number;

  // ===== 转换方法 =====

  /**
   * 转换为 Client DTO
   */}
