/**
 * IPC Result Adapter
 *
 * 为 IPC 通信提供 Result Pattern 适配
 * 统一 Main Process 和 Renderer Process 的数据交换格式
 *
 * @module @dailyuse/contracts/result/ipc
 */

// Import ResultCode from codes.ts to avoid circular dependency issues
import { ResultCode } from './codes';
import type { Result, ResultError, ResultMeta } from './index';
import { ok, fail, isOk } from './index';

// ============================================================================
// IPC Result Types
// ============================================================================

/**
 * IPC 传输的序列化 Result 格式
 * 这是 Main Process 和 Renderer Process 之间传输的格式
 */
export interface IpcResult<T = unknown> {
  /** 是否成功 */
  ok: boolean;
  /** 成功时的数据 */
  data?: T;
  /** 失败时的错误 */
  error?: {
    code: string;
    message: string;
    details?: Array<{
      field?: string;
      code: string;
      message: string;
      value?: unknown;
    }>;
  };
  /** 元数据 */
  meta?: {
    traceId?: string;
    duration?: number;
    timestamp?: number;
  };
}

// ============================================================================
// IPC Result Converters
// ============================================================================

/**
 * 将 Result 转换为 IPC 可传输的格式
 * 用于 Main Process 发送响应
 *
 * @example
 * ```ts
 * // Main Process IPC Handler
 * ipcMain.handle('user:get', async (_, id) => {
 *   const result = await userService.getById(id);
 *   return toIpcResult(result);
 * });
 * ```
 */
export function toIpcResult<T>(result: Result<T>): IpcResult<T> {
  if (isOk(result)) {
    return {
      ok: true,
      data: result.data,
      meta: result.meta ? {
        traceId: result.meta.traceId,
        duration: result.meta.duration,
        timestamp: result.meta.timestamp,
      } : undefined,
    };
  }

  return {
    ok: false,
    error: {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details?.map(d => ({
        field: d.field,
        code: d.code,
        message: d.message,
        value: d.value,
      })),
    },
    meta: result.meta ? {
      traceId: result.meta.traceId,
      duration: result.meta.duration,
      timestamp: result.meta.timestamp,
    } : undefined,
  };
}

/**
 * 将 IPC 响应转换回 Result 类型
 * 用于 Renderer Process 接收响应
 *
 * @example
 * ```ts
 * // Renderer Process
 * const ipcResult = await ipcRenderer.invoke('user:get', id);
 * const result = fromIpcResult<User>(ipcResult);
 *
 * if (isOk(result)) {
 *   console.log(result.data.name);
 * }
 * ```
 */
export function fromIpcResult<T>(ipcResult: IpcResult<T>): Result<T, ResultError> {
  const meta: ResultMeta | undefined = ipcResult.meta ? {
    traceId: ipcResult.meta.traceId,
    duration: ipcResult.meta.duration,
    timestamp: ipcResult.meta.timestamp,
  } : undefined;

  if (ipcResult.ok && ipcResult.data !== undefined) {
    return ok(ipcResult.data, meta);
  }

  const error: ResultError = {
    code: ipcResult.error?.code ?? ResultCode.UNKNOWN,
    message: ipcResult.error?.message ?? 'Unknown error',
    details: ipcResult.error?.details?.map(d => ({
      field: d.field,
      code: d.code,
      message: d.message,
      value: d.value,
    })),
  };

  return fail(error, meta);
}

// ============================================================================
// IPC Handler Utilities
// ============================================================================

/**
 * 创建带自动 Result 包装的 IPC 处理函数
 * 自动处理错误并转换为 IpcResult 格式
 *
 * @example
 * ```ts
 * // Main Process
 * const handler = createIpcHandler(async (id: string) => {
 *   const user = await db.users.findById(id);
 *   if (!user) {
 *     return ResultErrors.notFound('User not found');
 *   }
 *   return ok(user);
 * });
 *
 * ipcMain.handle('user:get', (_, id) => handler(id));
 * ```
 */
export function createIpcHandler<TArgs extends unknown[], TResult>(
  handler: (...args: TArgs) => Promise<Result<TResult>>,
): (...args: TArgs) => Promise<IpcResult<TResult>> {
  return async (...args: TArgs): Promise<IpcResult<TResult>> => {
    const startTime = Date.now();

    try {
      const result = await handler(...args);

      // 添加耗时信息
      const meta: ResultMeta = {
        ...result.meta,
        duration: Date.now() - startTime,
        timestamp: startTime,
      };

      if (isOk(result)) {
        return toIpcResult(ok(result.data, meta));
      }
      return toIpcResult(fail(result.error, meta));
    } catch (err) {
      // 未预期的错误
      return {
        ok: false,
        error: {
          code: ResultCode.INTERNAL_ERROR,
          message: err instanceof Error ? err.message : 'Internal error',
        },
        meta: {
          duration: Date.now() - startTime,
          timestamp: startTime,
        },
      };
    }
  };
}

/**
 * 创建 IPC 客户端调用包装器
 * 自动将 IpcResult 转换为 Result
 *
 * @example
 * ```ts
 * // Renderer Process
 * const ipcClient = createIpcClient(window.electron.ipcRenderer);
 *
 * const result = await ipcClient.invoke<User>('user:get', userId);
 * if (isOk(result)) {
 *   setUser(result.data);
 * }
 * ```
 */
export function createIpcClientWrapper(
  invoker: { invoke: (channel: string, ...args: unknown[]) => Promise<unknown> },
) {
  return {
    /**
     * 调用 IPC 并返回 Result
     */
    async invoke<T>(channel: string, ...args: unknown[]): Promise<Result<T, ResultError>> {
      const ipcResult = await invoker.invoke(channel, ...args) as IpcResult<T>;
      return fromIpcResult<T>(ipcResult);
    },

    /**
     * 调用 IPC 并直接返回数据（失败时抛出错误）
     * 用于不需要处理错误的场景
     */
    async invokeUnsafe<T>(channel: string, ...args: unknown[]): Promise<T> {
      const result = await this.invoke<T>(channel, ...args);
      if (isOk(result)) {
        return result.data;
      }
      throw new Error(`[${result.error.code}] ${result.error.message}`);
    },
  };
}
