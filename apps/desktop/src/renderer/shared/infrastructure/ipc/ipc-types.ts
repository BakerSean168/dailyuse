/**
 * IPC Types - 统一 IPC 通信类型定义
 * 
 * @module renderer/shared/infrastructure/ipc
 */

// ============ Response Types ============

/**
 * IPC 响应基础接口
 */
export interface IPCResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: IPCErrorData;
}

/**
 * IPC 错误数据
 */
export interface IPCErrorData {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

// ============ Request Types ============

/**
 * IPC 请求配置
 */
export interface IPCRequestOptions {
  /** 超时时间（毫秒），默认 30000 */
  timeout?: number;
  /** 重试次数，默认 0 */
  retries?: number;
  /** 重试延迟（毫秒），默认 1000 */
  retryDelay?: number;
  /** 是否启用日志，默认 true（开发模式） */
  logging?: boolean;
  /** 请求元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 批量请求项
 */
export interface BatchRequestItem<T = unknown> {
  /** IPC 通道名称 */
  channel: string;
  /** 请求参数 */
  payload?: unknown;
  /** 请求配置 */
  options?: IPCRequestOptions;
}

/**
 * 批量响应项
 */
export interface BatchResponseItem<T = unknown> {
  /** 是否成功 */
  ok: boolean;
  /** 响应数据 */
  data?: T;
  /** 错误信息 */
  error?: IPCErrorData;
  /** 原始请求 */
  request: BatchRequestItem;
}

// ============ Event Types ============

/**
 * IPC 事件监听器类型
 */
export type IPCEventListener<T = unknown> = (data: T) => void;

/**
 * IPC 事件订阅配置
 */
export interface IPCSubscriptionOptions {
  /** 是否只监听一次 */
  once?: boolean;
  /** 过滤函数 */
  filter?: (data: unknown) => boolean;
}

// ============ Channel Types ============

/**
 * IPC 通道定义
 */
export interface IPCChannelDefinition<TRequest = unknown, TResponse = unknown> {
  /** 通道名称 */
  channel: string;
  /** 请求类型（仅用于类型推断） */
  request?: TRequest;
  /** 响应类型（仅用于类型推断） */
  response?: TResponse;
}

// ============ Client Types ============

/**
 * IPC Client 接口
 */
export interface IIPCClient {
  /**
   * 发送 IPC 请求
   */
  invoke<T>(channel: string, payload?: unknown, options?: IPCRequestOptions): Promise<T>;
  
  /**
   * 批量发送 IPC 请求
   */
  batch<T extends unknown[]>(requests: BatchRequestItem[]): Promise<BatchResponseItem<T[number]>[]>;
  
  /**
   * 订阅 IPC 事件
   */
  on<T>(channel: string, listener: IPCEventListener<T>, options?: IPCSubscriptionOptions): () => void;
  
  /**
   * 取消订阅 IPC 事件
   */
  off(channel: string, listener: IPCEventListener): void;
}

// ============ Error Codes ============

/**
 * IPC 错误代码枚举
 */
export enum IPCErrorCode {
  // 通用错误
  UNKNOWN = 'IPC_UNKNOWN',
  TIMEOUT = 'IPC_TIMEOUT',
  CANCELLED = 'IPC_CANCELLED',
  NETWORK = 'IPC_NETWORK',
  
  // 请求错误
  INVALID_CHANNEL = 'IPC_INVALID_CHANNEL',
  INVALID_PAYLOAD = 'IPC_INVALID_PAYLOAD',
  SERIALIZATION = 'IPC_SERIALIZATION',
  
  // 响应错误
  HANDLER_NOT_FOUND = 'IPC_HANDLER_NOT_FOUND',
  HANDLER_ERROR = 'IPC_HANDLER_ERROR',
  RESPONSE_INVALID = 'IPC_RESPONSE_INVALID',
  
  // 业务错误
  NOT_FOUND = 'IPC_NOT_FOUND',
  VALIDATION = 'IPC_VALIDATION',
  UNAUTHORIZED = 'IPC_UNAUTHORIZED',
  FORBIDDEN = 'IPC_FORBIDDEN',
  CONFLICT = 'IPC_CONFLICT',
}
