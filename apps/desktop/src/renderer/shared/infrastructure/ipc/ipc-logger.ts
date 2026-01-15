/**
 * IPC Logger - IPC 请求/响应日志记录
 * 
 * @module renderer/shared/infrastructure/ipc
 */

import type { IPCErrorData, IPCRequestOptions, BatchRequestItem, BatchResponseItem } from './ipc-types';

// ============ Log Types ============

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface IPCLogEntry {
  timestamp: Date;
  level: LogLevel;
  channel: string;
  type: 'request' | 'response' | 'error' | 'retry' | 'timeout' | 'batch';
  duration?: number;
  payload?: unknown;
  response?: unknown;
  error?: IPCErrorData;
  metadata?: Record<string, unknown>;
}

export interface IPCLoggerConfig {
  /** 是否启用日志 */
  enabled: boolean;
  /** 最小日志级别 */
  minLevel: LogLevel;
  /** 是否输出到控制台 */
  console: boolean;
  /** 是否记录请求载荷 */
  logPayload: boolean;
  /** 是否记录响应数据 */
  logResponse: boolean;
  /** 载荷最大长度（字符串化后） */
  maxPayloadLength: number;
  /** 自定义日志处理器 */
  handlers: IPCLogHandler[];
}

export type IPCLogHandler = (entry: IPCLogEntry) => void;

// ============ Log Level Priority ============

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// ============ IPCLogger Class ============

/**
 * IPC 日志记录器
 */
export class IPCLogger {
  private config: IPCLoggerConfig;
  private requestTimers: Map<string, number> = new Map();
  private static instance: IPCLogger | null = null;

  constructor(config?: Partial<IPCLoggerConfig>) {
    const isDev = import.meta.env.DEV;
    
    this.config = {
      enabled: isDev,
      minLevel: isDev ? 'debug' : 'warn',
      console: isDev,
      logPayload: isDev,
      logResponse: isDev,
      maxPayloadLength: 1000,
      handlers: [],
      ...config,
    };
  }

  /**
   * 获取单例实例
   */
  static getInstance(config?: Partial<IPCLoggerConfig>): IPCLogger {
    if (!IPCLogger.instance) {
      IPCLogger.instance = new IPCLogger(config);
    }
    return IPCLogger.instance;
  }

  /**
   * 重置单例（用于测试）
   */
  static resetInstance(): void {
    IPCLogger.instance = null;
  }

  /**
   * 更新配置
   */
  configure(config: Partial<IPCLoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 添加日志处理器
   */
  addHandler(handler: IPCLogHandler): void {
    this.config.handlers.push(handler);
  }

  /**
   * 移除日志处理器
   */
  removeHandler(handler: IPCLogHandler): void {
    const index = this.config.handlers.indexOf(handler);
    if (index > -1) {
      this.config.handlers.splice(index, 1);
    }
  }

  /**
   * 记录请求开始
   */
  logRequestStart(
    channel: string,
    payload?: unknown,
    options?: IPCRequestOptions
  ): string {
    const requestId = this.generateRequestId(channel);
    this.requestTimers.set(requestId, performance.now());

    this.log({
      level: 'debug',
      channel,
      type: 'request',
      payload: this.config.logPayload ? this.truncatePayload(payload) : undefined,
      metadata: { requestId, options },
    });

    return requestId;
  }

  /**
   * 记录请求成功
   */
  logRequestSuccess<T>(
    channel: string,
    requestId: string,
    response?: T
  ): void {
    const duration = this.calculateDuration(requestId);

    this.log({
      level: 'info',
      channel,
      type: 'response',
      duration,
      response: this.config.logResponse ? this.truncatePayload(response) : undefined,
      metadata: { requestId },
    });
  }

  /**
   * 记录请求错误
   */
  logRequestError(
    channel: string,
    requestId: string,
    error: IPCErrorData
  ): void {
    const duration = this.calculateDuration(requestId);

    this.log({
      level: 'error',
      channel,
      type: 'error',
      duration,
      error,
      metadata: { requestId },
    });
  }

  /**
   * 记录重试
   */
  logRetry(
    channel: string,
    requestId: string,
    attempt: number,
    maxAttempts: number,
    error: IPCErrorData
  ): void {
    this.log({
      level: 'warn',
      channel,
      type: 'retry',
      error,
      metadata: { requestId, attempt, maxAttempts },
    });
  }

  /**
   * 记录超时
   */
  logTimeout(
    channel: string,
    requestId: string,
    timeout: number
  ): void {
    const duration = this.calculateDuration(requestId);

    this.log({
      level: 'error',
      channel,
      type: 'timeout',
      duration,
      metadata: { requestId, timeout },
    });
  }

  /**
   * 记录批量请求
   */
  logBatch(
    requests: BatchRequestItem[],
    results: BatchResponseItem[]
  ): void {
    const successCount = results.filter(r => r.ok).length;
    const failCount = results.length - successCount;

    this.log({
      level: failCount > 0 ? 'warn' : 'info',
      channel: 'batch',
      type: 'batch',
      metadata: {
        total: requests.length,
        success: successCount,
        failed: failCount,
        channels: requests.map(r => r.channel),
      },
    });
  }

  // ============ Private Methods ============

  private log(entry: Omit<IPCLogEntry, 'timestamp'>): void {
    if (!this.config.enabled) return;
    if (LOG_LEVEL_PRIORITY[entry.level] < LOG_LEVEL_PRIORITY[this.config.minLevel]) return;

    const fullEntry: IPCLogEntry = {
      ...entry,
      timestamp: new Date(),
    };

    // 控制台输出
    if (this.config.console) {
      this.consoleLog(fullEntry);
    }

    // 调用自定义处理器
    for (const handler of this.config.handlers) {
      try {
        handler(fullEntry);
      } catch (e) {
        console.error('[IPCLogger] Handler error:', e);
      }
    }
  }

  private consoleLog(entry: IPCLogEntry): void {
    const prefix = `[IPC:${entry.channel}]`;
    const durationStr = entry.duration !== undefined ? `(${entry.duration.toFixed(1)}ms)` : '';
    
    const styles = {
      debug: 'color: #888',
      info: 'color: #2196F3',
      warn: 'color: #FF9800',
      error: 'color: #F44336',
    };

    const logMethod = {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error,
    }[entry.level];

    switch (entry.type) {
      case 'request':
        console.groupCollapsed(`%c${prefix} → Request`, styles[entry.level]);
        if (entry.payload) console.log('Payload:', entry.payload);
        if (entry.metadata) console.log('Metadata:', entry.metadata);
        console.groupEnd();
        break;

      case 'response':
        logMethod(
          `%c${prefix} ← Response ${durationStr}`,
          styles[entry.level],
          entry.response ?? ''
        );
        break;

      case 'error':
        console.groupCollapsed(`%c${prefix} ✗ Error ${durationStr}`, styles.error);
        console.error('Error:', entry.error);
        if (entry.metadata) console.log('Metadata:', entry.metadata);
        console.groupEnd();
        break;

      case 'retry':
        logMethod(
          `%c${prefix} ↻ Retry ${entry.metadata?.attempt}/${entry.metadata?.maxAttempts}`,
          styles.warn,
          entry.error?.message
        );
        break;

      case 'timeout':
        logMethod(
          `%c${prefix} ⏱ Timeout after ${entry.metadata?.timeout}ms`,
          styles.error
        );
        break;

      case 'batch':
        console.groupCollapsed(
          `%c[IPC:Batch] ${entry.metadata?.success}/${entry.metadata?.total} succeeded`,
          entry.metadata?.failed ? styles.warn : styles.info
        );
        console.log('Channels:', entry.metadata?.channels);
        console.groupEnd();
        break;
    }
  }

  private generateRequestId(channel: string): string {
    return `${channel}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private calculateDuration(requestId: string): number | undefined {
    const startTime = this.requestTimers.get(requestId);
    if (startTime !== undefined) {
      this.requestTimers.delete(requestId);
      return performance.now() - startTime;
    }
    return undefined;
  }

  private truncatePayload(payload: unknown): unknown {
    if (payload === undefined || payload === null) return payload;

    try {
      const str = JSON.stringify(payload);
      if (str.length <= this.config.maxPayloadLength) {
        return payload;
      }
      return {
        __truncated: true,
        preview: str.slice(0, this.config.maxPayloadLength) + '...',
        length: str.length,
      };
    } catch {
      return { __unserializable: true, type: typeof payload };
    }
  }
}

// ============ Singleton Export ============

export const ipcLogger = IPCLogger.getInstance();
