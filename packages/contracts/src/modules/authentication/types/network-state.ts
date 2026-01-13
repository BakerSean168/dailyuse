/**
 * Network State Types
 * 网络状态相关类型定义
 */

/**
 * 网络状态
 */
export type NetworkStatus = 'online' | 'offline' | 'unknown';

/**
 * 网络状态变化事件
 */
export interface NetworkStateChangeEvent {
  /** 当前状态 */
  status: NetworkStatus;
  /** 之前状态 */
  previousStatus: NetworkStatus;
  /** 事件时间戳 (ms) */
  timestamp: number;
}

/**
 * 网络检查配置
 */
export interface NetworkCheckConfig {
  /** 检查间隔（毫秒） */
  checkInterval?: number;
  /** 健康检查 URL */
  healthCheckUrl?: string;
  /** 启用定期健康检查 */
  enableHealthCheck?: boolean;
  /** 超时时间（毫秒） */
  timeout?: number;
}
