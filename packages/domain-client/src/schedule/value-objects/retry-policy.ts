/**
 * RetryPolicyClient 值对象
 * 重试策略 - 客户端值对象
 * 实现 IRetryPolicyClient 接口
 */

import type { IRetryPolicyClient, RetryPolicyClientDTO, RetryPolicyServerDTO } from '@dailyuse/contracts/schedule';
import { ValueObject } from '@dailyuse/utils';

/**
 * RetryPolicyClient 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class RetryPolicy extends ValueObject implements IRetryPolicyClient {
  public readonly enabled: boolean;
  public readonly maxRetries: number;
  public readonly retryDelay: number;
  public readonly backoffMultiplier: number;
  public readonly maxRetryDelay: number;

  constructor(params: {
    enabled: boolean;
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
    maxRetryDelay: number;
  }) {
    super();

    this.enabled = params.enabled;
    this.maxRetries = params.maxRetries;
    this.retryDelay = params.retryDelay;
    this.backoffMultiplier = params.backoffMultiplier;
    this.maxRetryDelay = params.maxRetryDelay;

    // 确保不可变
    Object.freeze(this);
  }

  // UI 辅助属性
  public get policyDescription(): string {
    if (!this.enabled) {
      return '重试已禁用';
    }
    return `最多重试 ${this.maxRetries} 次，延迟 ${this.retryDelayFormatted} ~ ${this.maxRetryDelayFormatted}`;
  }

  public get enabledDisplay(): string {
    return this.enabled ? '已启用' : '已禁用';
  }

  public get retryDelayFormatted(): string {
    return this.formatMilliseconds(this.retryDelay);
  }

  public get maxRetryDelayFormatted(): string {
    return this.formatMilliseconds(this.maxRetryDelay);
  }

  public get hasBackoff(): boolean {
    return this.backoffMultiplier > 1;
  }

  public get backoffDescription(): string {
    if (!this.hasBackoff) {
      return '固定延迟';
    }
    return `指数退避 (${this.backoffMultiplier}x)`;
  }

  private formatMilliseconds(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.floor(ms / 1000)}秒`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}分钟`;
    return `${Math.floor(ms / 3600000)}小时`;
  }

  /**
   * 计算第 N 次重试的延迟时间
   */
  public calculateDelayForAttempt(attemptNumber: number): number {
    const calculatedDelay = this.retryDelay * Math.pow(this.backoffMultiplier, attemptNumber - 1);
    return Math.min(calculatedDelay, this.maxRetryDelay);
  }

  /**
   * 格式化第 N 次重试的延迟时间
   */
  public getFormattedDelayForAttempt(attemptNumber: number): string {
    const delayMs = this.calculateDelayForAttempt(attemptNumber);
    return this.formatMilliseconds(delayMs);
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof RetryPolicy)) {
      return false;
    }

    return (
      this.enabled === other.enabled &&
      this.maxRetries === other.maxRetries &&
      this.retryDelay === other.retryDelay &&
      this.backoffMultiplier === other.backoffMultiplier &&
      this.maxRetryDelay === other.maxRetryDelay
    );
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): RetryPolicyServerDTO {
    return {
      enabled: this.enabled,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
      backoffMultiplier: this.backoffMultiplier,
      maxRetryDelay: this.maxRetryDelay,
    };
  }

  /**
   * 从 Server DTO 创建值对象
   */
  public static fromServerDTO(dto: RetryPolicyServerDTO): RetryPolicy {
    return new RetryPolicy({
      enabled: dto.enabled,
      maxRetries: dto.maxRetries,
      retryDelay: dto.retryDelay,
      backoffMultiplier: dto.backoffMultiplier,
      maxRetryDelay: dto.maxRetryDelay,
    });
  }

  /**
   * 从 Client DTO 创建值对象
   */
  public static fromClientDTO(dto: RetryPolicyClientDTO): RetryPolicy {
    return new RetryPolicy({
      enabled: dto.enabled,
      maxRetries: dto.maxRetries,
      retryDelay: dto.retryDelay,
      backoffMultiplier: dto.backoffMultiplier,
      maxRetryDelay: dto.maxRetryDelay,
    });
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): RetryPolicyClientDTO {
    return {
      enabled: this.enabled,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
      backoffMultiplier: this.backoffMultiplier,
      maxRetryDelay: this.maxRetryDelay,
      policyDescription: this.policyDescription,
      enabledDisplay: this.enabledDisplay,
      retryDelayFormatted: this.retryDelayFormatted,
      maxRetryDelayFormatted: this.maxRetryDelayFormatted,
    };
  }

  /**
   * 创建默认重试策略
   */
  public static createDefault(): RetryPolicy {
    return new RetryPolicy({
      enabled: true,
      maxRetries: 3,
      retryDelay: 5000, // 5 秒
      backoffMultiplier: 2.0, // 指数退避
      maxRetryDelay: 60000, // 最大 60 秒
    });
  }

  /**
   * 创建无重试策略
   */
  public static createNoRetry(): RetryPolicy {
    return new RetryPolicy({
      enabled: false,
      maxRetries: 0,
      retryDelay: 0,
      backoffMultiplier: 1.0,
      maxRetryDelay: 0,
    });
  }
}
