/**
 * Retry Policy Value Object
 * 重试策略值对�?
 */

// ============ 接口定义 ============

/**
 * 重试策略 - Server 接口
 */
export interface IRetryPolicyServer {
  /** 是否启用重试 */
  enabled: boolean;

  /** 最大重试次�?*/
  maxRetries: number;

  /** 初始重试延迟（毫秒） */
  retryDelay: number;

  /** 退避倍数（用于指数退避） */
  backoffMultiplier: number;

  /** 最大重试延迟（毫秒�?*/
  maxRetryDelay: number;

  // 值对象方�?
  with(
    updates: Partial<
      Omit<
        IRetryPolicyServer,
        | 'equals'
        | 'with'
        | 'shouldRetry'
        | 'calculateNextRetryDelay'
        | 'toServerDTO'
        | 'toClientDTO'
        | 'toPersistenceDTO'
      >
    >,
  ): IRetryPolicyServer;

  // DTO 转换方法
}

/**
 * 重试策略 - Client 接口
 */
export interface IRetryPolicyClient {
  /** 是否启用重试 */
  enabled: boolean;

  /** 最大重试次�?*/
  maxRetries: number;

  /** 初始重试延迟 */
  retryDelay: number;

  /** 退避倍数 */
  backoffMultiplier: number;

  /** 最大重试延�?*/
  maxRetryDelay: number;

  // UI 辅助属�?
  /** 重试策略描述 */
  policyDescription: string; // "最多重�?3 次，延迟 5s ~ 60s"

  /** 启用状态显�?*/
  enabledDisplay: string; // "已启�? | "已禁�?

  /** 重试延迟格式�?*/
  retryDelayFormatted: string; // "5 �?

  /** 最大重试延迟格式化 */
  maxRetryDelayFormatted: string; // "60 �?

  // 值对象方�?

  // DTO 转换方法
}

// ============ DTO 定义 ============

/**
 * Retry Policy Server DTO
 */
export interface RetryPolicyServerDTO {
  enabled: boolean;
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  maxRetryDelay: number;
}

/**
 * Retry Policy Client DTO
 */
export interface RetryPolicyClientDTO {
  enabled: boolean;
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  maxRetryDelay: number;
  policyDescription: string;
  enabledDisplay: string;
  retryDelayFormatted: string;
  maxRetryDelayFormatted: string;
}

/**
 * Retry Policy Persistence DTO
 */
export interface RetryPolicyPersistenceDTO {
  enabled: boolean;
  maxRetries: number;
  retry_delay: number;
  backoff_multiplier: number;
  max_retry_delay: number;
}

// ============ 类型导出 ============

export type RetryPolicyServer = IRetryPolicyServer;
export type RetryPolicyClient = IRetryPolicyClient;
