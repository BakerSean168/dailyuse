/**
 * Base IPC Client - 统一 IPC 通信客户端
 * 
 * 提供统一的 window.electronAPI.invoke 封装，包含：
 * - 类型安全的请求/响应
 * - 超时处理
 * - 自动重试
 * - 错误处理
 * - 请求日志
 * - 批量请求支持
 * 
 * @module renderer/shared/infrastructure/ipc
 * 
 * @example
 * ```typescript
 * // 基本用法
 * const result = await ipcClient.invoke<TaskTemplateClientDTO>('task:get-template', { uuid });
 * 
 * // 带配置
 * const data = await ipcClient.invoke<GoalClientDTO[]>('goal:list', 
 *   { accountUuid },
 *   { timeout: 5000, retries: 2 }
 * );
 * 
 * // 批量请求
 * const results = await ipcClient.batch([
 *   { channel: 'task:list', payload: { accountUuid } },
 *   { channel: 'goal:list', payload: { accountUuid } },
 * ]);
 * ```
 */

import type {
  IPCRequestOptions,
  IPCResponse,
  BatchRequestItem,
  BatchResponseItem,
  IPCEventListener,
  IPCSubscriptionOptions,
  IIPCClient,
} from './ipc-types';

import { IPCErrorCode } from './ipc-types';

import {
  IPCError,
  IPCTimeoutError,
  createIPCError,
  isRetryableError,
} from './ipc-error';

import { IPCLogger, ipcLogger } from './ipc-logger';

// ============ Constants ============

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRIES = 0;
const DEFAULT_RETRY_DELAY = 1000; // 1 second

// ============ BaseIPCClient Class ============

/**
 * 基础 IPC 客户端
 */
export class BaseIPCClient implements IIPCClient {
  private logger: IPCLogger;
  private defaultOptions: Required<IPCRequestOptions>;
  private abortControllers: Map<string, AbortController> = new Map();
  private eventListeners: Map<string, Set<IPCEventListener>> = new Map();

  constructor(options?: Partial<IPCRequestOptions>) {
    this.logger = ipcLogger;
    this.defaultOptions = {
      timeout: options?.timeout ?? DEFAULT_TIMEOUT,
      retries: options?.retries ?? DEFAULT_RETRIES,
      retryDelay: options?.retryDelay ?? DEFAULT_RETRY_DELAY,
      logging: options?.logging ?? true,
      metadata: options?.metadata ?? {},
    };
  }

  // ============ Core Methods ============

  /**
   * 发送 IPC 请求
   * 
   * @param channel - IPC 通道名称
   * @param payload - 请求参数
   * @param options - 请求配置
   * @returns 响应数据
   * @throws {IPCError} 当请求失败时
   */
  async invoke<T>(
    channel: string,
    payload?: unknown,
    options?: IPCRequestOptions
  ): Promise<T> {
    const mergedOptions = this.mergeOptions(options);
    const requestId = mergedOptions.logging
      ? this.logger.logRequestStart(channel, payload, mergedOptions)
      : '';

    let lastError: IPCError | null = null;
    let attempts = 0;
    const maxAttempts = mergedOptions.retries + 1;

    while (attempts < maxAttempts) {
      attempts++;

      try {
        const result = await this.invokeWithTimeout<T>(
          channel,
          payload,
          mergedOptions.timeout,
          requestId
        );

        if (mergedOptions.logging) {
          this.logger.logRequestSuccess(channel, requestId, result);
        }

        return result;
      } catch (error) {
        lastError = IPCError.fromUnknown(error, channel);

        // 检查是否应该重试
        if (attempts < maxAttempts && isRetryableError(lastError)) {
          if (mergedOptions.logging) {
            this.logger.logRetry(channel, requestId, attempts, maxAttempts, lastError.toJSON());
          }
          await this.delay(mergedOptions.retryDelay);
          continue;
        }

        if (mergedOptions.logging) {
          this.logger.logRequestError(channel, requestId, lastError.toJSON());
        }

        throw lastError;
      }
    }

    // 不应该到达这里，但为了类型安全
    throw lastError ?? new IPCError(IPCErrorCode.UNKNOWN, 'Unknown error');
  }

  /**
   * 批量发送 IPC 请求
   * 
   * @param requests - 请求数组
   * @returns 响应数组（与请求顺序对应）
   */
  async batch<T extends unknown[]>(
    requests: BatchRequestItem[]
  ): Promise<BatchResponseItem<T[number]>[]> {
    const startTime = performance.now();
    
    const promises = requests.map(async (request) => {
      try {
        const data = await this.invoke<T[number]>(
          request.channel,
          request.payload,
          { ...request.options, logging: false } // 批量请求单独记录日志
        );
        return {
          success: true,
          data,
          request,
        } as BatchResponseItem<T[number]>;
      } catch (error) {
        const ipcError = IPCError.fromUnknown(error, request.channel);
        return {
          success: false,
          error: ipcError.toJSON(),
          request,
        } as BatchResponseItem<T[number]>;
      }
    });

    const results = await Promise.all(promises);
    
    // 记录批量请求日志
    this.logger.logBatch(requests, results);

    return results;
  }

  /**
   * 按顺序执行批量请求（前一个完成后才执行下一个）
   */
  async batchSequential<T extends unknown[]>(
    requests: BatchRequestItem[]
  ): Promise<BatchResponseItem<T[number]>[]> {
    const results: BatchResponseItem<T[number]>[] = [];

    for (const request of requests) {
      try {
        const data = await this.invoke<T[number]>(
          request.channel,
          request.payload,
          request.options
        );
        results.push({ success: true, data, request });
      } catch (error) {
        const ipcError = IPCError.fromUnknown(error, request.channel);
        results.push({ success: false, error: ipcError.toJSON(), request });
      }
    }

    return results;
  }

  // ============ Event Subscription ============

  /**
   * 订阅 IPC 事件
   * 
   * @param channel - 事件通道
   * @param listener - 事件处理器
   * @param options - 订阅选项
   * @returns 取消订阅函数
   */
  on<T>(
    channel: string,
    listener: IPCEventListener<T>,
    options?: IPCSubscriptionOptions
  ): () => void {
    const wrappedListener = ((data: unknown) => {
      // 应用过滤器
      if (options?.filter && !options.filter(data)) {
        return;
      }

      listener(data as T);

      // 如果是一次性监听，自动取消订阅
      if (options?.once) {
        this.off(channel, wrappedListener);
      }
    }) as IPCEventListener;

    // 注册到内部映射
    if (!this.eventListeners.has(channel)) {
      this.eventListeners.set(channel, new Set());
    }
    this.eventListeners.get(channel)!.add(wrappedListener);

    // 注册到 electronAPI（如果有事件支持）
    const electronAPI = this.getElectronAPI();
    if (electronAPI && typeof electronAPI.on === 'function') {
      electronAPI.on(channel, wrappedListener);
    }

    // 返回取消订阅函数
    return () => this.off(channel, wrappedListener);
  }

  /**
   * 取消订阅 IPC 事件
   */
  off(channel: string, listener: IPCEventListener): void {
    const listeners = this.eventListeners.get(channel);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.eventListeners.delete(channel);
      }
    }

    // 从 electronAPI 取消订阅（如果有事件支持）
    const electronAPI = this.getElectronAPI();
    if (electronAPI && typeof electronAPI.off === 'function') {
      electronAPI.off(channel, listener);
    }
  }

  /**
   * 一次性事件订阅
   */
  once<T>(channel: string, listener: IPCEventListener<T>): () => void {
    return this.on(channel, listener, { once: true });
  }

  // ============ Abort / Cancel ============

  /**
   * 创建可取消的请求
   */
  createCancellableRequest<T>(
    channel: string,
    payload?: unknown,
    options?: IPCRequestOptions
  ): { promise: Promise<T>; cancel: () => void } {
    const abortController = new AbortController();
    const requestId = `${channel}-${Date.now()}`;
    this.abortControllers.set(requestId, abortController);

    const promise = new Promise<T>((resolve, reject) => {
      // 监听取消信号
      abortController.signal.addEventListener('abort', () => {
        this.abortControllers.delete(requestId);
        reject(new IPCError(IPCErrorCode.CANCELLED, 'Request was cancelled', { channel }));
      });

      // 执行请求
      this.invoke<T>(channel, payload, options)
        .then((result) => {
          this.abortControllers.delete(requestId);
          resolve(result);
        })
        .catch((error) => {
          this.abortControllers.delete(requestId);
          reject(error);
        });
    });

    return {
      promise,
      cancel: () => abortController.abort(),
    };
  }

  /**
   * 取消所有进行中的请求
   */
  cancelAll(): void {
    for (const [requestId, controller] of this.abortControllers) {
      controller.abort();
      this.abortControllers.delete(requestId);
    }
  }

  // ============ Configuration ============

  /**
   * 更新默认配置
   */
  setDefaultOptions(options: Partial<IPCRequestOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }

  /**
   * 获取当前默认配置
   */
  getDefaultOptions(): Required<IPCRequestOptions> {
    return { ...this.defaultOptions };
  }

  // ============ Private Methods ============

  private async invokeWithTimeout<T>(
    channel: string,
    payload: unknown,
    timeout: number,
    requestId: string
  ): Promise<T> {
    const electronAPI = this.getElectronAPI();
    
    if (!electronAPI || typeof electronAPI.invoke !== 'function') {
      throw new IPCError(
        IPCErrorCode.NETWORK,
        'Electron API is not available. Are you running in Electron?',
        { channel }
      );
    }

    return new Promise<T>((resolve, reject) => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let isResolved = false;

      // 设置超时
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            this.logger.logTimeout(channel, requestId, timeout);
            reject(new IPCTimeoutError(channel, timeout));
          }
        }, timeout);
      }

      // 发送请求
      electronAPI
        .invoke(channel, payload)
        .then((response) => {
          const typedResponse = response as IPCResponse<T>;
          if (isResolved) return;
          isResolved = true;
          if (timeoutId) clearTimeout(timeoutId);

          if (typedResponse.ok) {
            resolve(typedResponse.data as T);
          } else if (typedResponse.error) {
            reject(createIPCError(typedResponse.error, channel));
          } else {
            reject(new IPCError(IPCErrorCode.RESPONSE_INVALID, 'Invalid IPC response', { channel }));
          }
        })
        .catch((error: Error) => {
          if (isResolved) return;
          isResolved = true;
          if (timeoutId) clearTimeout(timeoutId);
          reject(IPCError.fromUnknown(error, channel));
        });
    });
  }

  private getElectronAPI(): ElectronAPI | undefined {
    // 类型声明在 electron.d.ts 中
    return (window as { electronAPI?: ElectronAPI }).electronAPI;
  }

  private mergeOptions(options?: IPCRequestOptions): Required<IPCRequestOptions> {
    return {
      ...this.defaultOptions,
      ...options,
      metadata: {
        ...this.defaultOptions.metadata,
        ...options?.metadata,
      },
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============ Type Definitions ============

interface ElectronAPI {
  invoke: (channel: string, payload?: unknown) => Promise<IPCResponse<unknown>>;
  on?: (channel: string, listener: IPCEventListener) => void;
  off?: (channel: string, listener: IPCEventListener) => void;
}

// ============ Singleton Export ============

/**
 * 默认 IPC 客户端实例
 */
export const ipcClient = new BaseIPCClient();
