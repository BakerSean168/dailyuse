/**
 * IPC 处理器基类
 * 提供统一的 IPC 请求处理、错误处理和响应格式
 * 
 * 功能：
 * - 统一的 IPC 响应格式（使用 Result Pattern）
 * - 自动错误处理和转换
 * - 请求验证和授权
 * - 日志记录
 * - 性能监控
 * 
 * @see {@link @dailyuse/contracts/result} Result Pattern 核心模块
 */

import { createLogger, type ILogger } from '@dailyuse/utils';
import {
  type Result,
  type IpcResult,
  ok,
  fail,
  ResultCode,
  ResultErrors,
  toIpcResult,
} from '@dailyuse/contracts/result';
import { ServiceError } from './service-decorators';

/**
 * IPC 响应格式
 * 
 * 使用 Result Pattern 的 IpcResult 类型
 * @see {@link IpcResult}
 */
export type { IpcResult as IPCResponse };

/**
 * IPC 处理器基类
 */
export abstract class BaseIPCHandler {
  protected logger: ILogger;
  protected handlerName: string;

  constructor(handlerName: string) {
    this.handlerName = handlerName;
    this.logger = createLogger(`IPC:${handlerName}`);
  }

  /**
   * 处理 IPC 请求
   * 包装错误处理、日志和性能监控
   * 
   * 返回 IpcResult 格式，与 Result Pattern 兼容
   */
  protected async handleRequest<T>(
    channel: string,
    fn: () => Promise<T>,
    context?: { accountUuid?: string; userId?: string },
  ): Promise<IpcResult<T>> {
    const startTime = performance.now();
    const startMs = Date.now();

    try {
      this.logger.debug(`IPC request: ${channel}`, {
        accountUuid: context?.accountUuid,
      });

      const data = await fn();

      const duration = performance.now() - startTime;

      this.logger.info(`IPC request completed: ${channel}`, {
        duration: `${duration.toFixed(2)}ms`,
        durationMs: Math.round(duration),
        accountUuid: context?.accountUuid,
      });

      // 使用 Result Pattern 构建成功响应
      const result: Result<T> = ok(data);
      return toIpcResult(result, {
        duration: Math.round(duration),
        timestamp: startMs,
      });
    } catch (error) {
      const duration = performance.now() - startTime;

      this.logger.error(`IPC request failed: ${channel}`, {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        duration: `${duration.toFixed(2)}ms`,
        durationMs: Math.round(duration),
        accountUuid: context?.accountUuid,
      });

      // 使用 Result Pattern 构建错误响应
      let result: Result<T>;

      if (error instanceof ServiceError) {
        result = fail(ResultErrors.custom(
          error.code,
          error.message,
          error.statusCode || ResultCode.INTERNAL_ERROR,
          error.details,
        ));
      } else if (error instanceof Error) {
        result = fail(ResultErrors.internalError(error.message || 'Internal server error'));
      } else {
        result = fail(ResultErrors.unknownError('An unknown error occurred'));
      }

      return toIpcResult(result, {
        duration: Math.round(duration),
        timestamp: startMs,
      });
    }
  }

  /**
   * 验证请求授权
   */
  protected assertAuthorized(
    hasAccess: boolean,
    message: string = 'Unauthorized',
  ): void {
    if (!hasAccess) {
      const error = new ServiceError('UNAUTHORIZED', message, 401);
      throw error;
    }
  }

  /**
   * 验证请求参数
   */
  protected validateRequest<T>(
    data: any,
    rules: Record<string, (v: any) => boolean>,
  ): asserts data is T {
    for (const [field, rule] of Object.entries(rules)) {
      if (!rule(data?.[field])) {
        throw new ServiceError('INVALID_REQUEST', `Invalid parameter: ${field}`, 400);
      }
    }
  }
}

/**
 * IPC 处理器注册器
 * 用于在 IPC 主进程中注册处理器
 */
export class IPCHandlerRegistry {
  private handlers = new Map<string, (args: any) => Promise<any>>();
  private logger = createLogger('IPCHandlerRegistry');

  /**
   * 注册处理器
   */
  registerHandler(
    channel: string,
    handler: (args: any) => Promise<any>,
  ): void {
    if (this.handlers.has(channel)) {
      this.logger.warn(`Handler already registered for channel: ${channel}`);
    }
    this.handlers.set(channel, handler);
    this.logger.debug(`Registered IPC handler: ${channel}`);
  }

  /**
   * 获取处理器
   */
  getHandler(channel: string): ((args: any) => Promise<any>) | undefined {
    return this.handlers.get(channel);
  }

  /**
   * 列出所有已注册的处理器
   */
  listHandlers(): string[] {
    return Array.from(this.handlers.keys());
  }
}

// 全局 IPC 处理器注册器
export const globalIPCHandlerRegistry = new IPCHandlerRegistry();
