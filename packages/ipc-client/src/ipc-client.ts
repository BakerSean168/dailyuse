/**
 * IPC Client — 兼容现有 Adapter 层（返回 T，出错抛异常）
 *
 * 与 `AxiosHttpClient` 对等：
 * - `AxiosHttpClient` 实现 `HttpClient` 接口，返回 `Promise<T>`
 * - `IpcClientImpl` 实现 `IpcClient` 接口，返回 `Promise<T>`
 *
 * 两者的 Adapter 层使用方式完全一致：
 * ```ts
 * // HTTP Adapter
 * const goals = await this.httpClient.get<Goal[]>('/goals');
 *
 * // IPC Adapter
 * const goals = await this.ipcClient.invoke<Goal[]>('goal:list');
 * ```
 *
 * 特性：
 * - 自动解包 IpcResult 信封（从 Main Process 返回的 { ok, data, error } 格式）
 * - 成功时返回纯业务数据 `T`
 * - 失败时抛出 `IpcClientError`
 * - 支持非 IpcResult 格式的透传（向后兼容）
 *
 * @module @dailyuse/ipc-client
 */

import type { IpcResult } from '@dailyuse/contracts/result';
import type { ElectronBridge, IpcClient, IpcClientConfig } from './types';
import { DEFAULT_IPC_CLIENT_CONFIG, IpcClientError, getElectronBridge } from './types';

// ============================================================================
// IpcClientImpl
// ============================================================================

/**
 * IPC Client 实现 — 返回 `Promise<T>`，与现有 IPC Adapter 兼容
 *
 * 自动解包主进程返回的 `IpcResult<T>` 信封：
 * - `{ ok: true, data }` → 返回 `data`
 * - `{ ok: false, error }` → 抛出 `IpcClientError`
 *
 * @example
 * ```ts
 * import { IpcClientImpl } from '@dailyuse/ipc-client';
 *
 * const ipcClient = new IpcClientImpl();
 *
 * // 在 Adapter 中
 * try {
 *   const goals = await ipcClient.invoke<Goal[]>('goal:list');
 * } catch (e) {
 *   if (e instanceof IpcClientError) {
 *     console.error(e.code, e.message);
 *   }
 * }
 * ```
 */
export class IpcClientImpl implements IpcClient {
  private bridge: ElectronBridge | undefined;
  private readonly enableLogging: boolean;
  private readonly timeout: number;

  constructor(config: IpcClientConfig = {}) {
    this.bridge = config.bridge ?? getElectronBridge();
    this.enableLogging = config.enableLogging ?? DEFAULT_IPC_CLIENT_CONFIG.enableLogging;
    this.timeout = config.timeout ?? DEFAULT_IPC_CLIENT_CONFIG.timeout;
  }

  /**
   * 调用主进程 IPC handler
   *
   * @param channel - IPC channel 名称（e.g. 'goal:list', 'governance:rule:create'）
   * @param args - 传给 handler 的参数
   * @returns 解包后的业务数据 T
   * @throws IpcClientError — 当 IPC 调用失败时
   */
  async invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T> {
    if (!this.bridge) {
      throw new IpcClientError(
        'Electron IPC bridge not available. Are you running in Electron?',
        'BRIDGE_NOT_FOUND',
        channel,
      );
    }

    if (this.enableLogging) {
      console.debug(`[IPC] → ${channel}`, args.length > 0 ? args : '');
    }

    try {
      const response = await this.invokeWithTimeout<T>(channel, ...args);
      return this.unwrapResponse<T>(channel, response);
    } catch (error: any) {
      // 如果已经是 IpcClientError，直接抛出
      if (error instanceof IpcClientError) {
        throw error;
      }

      // 底层通信异常
      throw new IpcClientError(
        error.message ?? 'IPC invocation failed',
        'IPC_ERROR',
        channel,
        undefined,
        error,
      );
    }
  }

  // ────────────────────────────────────────
  // Private
  // ────────────────────────────────────────

  /**
   * 带超时的 IPC 调用
   */
  private invokeWithTimeout<T>(channel: string, ...args: unknown[]): Promise<T> {
    const invokePromise = this.bridge!.invoke<T>(channel, ...args);

    if (this.timeout <= 0) {
      return invokePromise;
    }

    return Promise.race([
      invokePromise,
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new IpcClientError(
            `IPC 调用超时 (${this.timeout}ms): ${channel}`,
            'TIMEOUT',
            channel,
          ));
        }, this.timeout);
      }),
    ]);
  }

  /**
   * 解包 IPC 响应
   *
   * 主进程通过 BaseIPCHandler 返回 IpcResult 格式：
   * - `{ ok: true, data }` → 返回 data
   * - `{ ok: false, error }` → 抛出 IpcClientError
   * - 非 IpcResult 格式 → 透传（向后兼容）
   */
  private unwrapResponse<T>(channel: string, response: unknown): T {
    // 检测是否为 IpcResult 信封格式
    if (this.isIpcResultEnvelope(response)) {
      const ipcResult = response as IpcResult<T>;

      if (ipcResult.ok) {
        if (this.enableLogging) {
          console.debug(`[IPC] ← ${channel} ✓`);
        }
        return ipcResult.data as T;
      }

      // 失败：抛出结构化错误
      throw new IpcClientError(
        ipcResult.error?.message ?? 'IPC request failed',
        ipcResult.error?.code ?? 'UNKNOWN',
        channel,
        ipcResult.error?.details,
      );
    }

    // 非标准格式 — 透传
    if (this.enableLogging) {
      console.debug(`[IPC] ← ${channel} (raw)`);
    }
    return response as T;
  }

  /**
   * 判断是否为 IpcResult 信封格式
   */
  private isIpcResultEnvelope(data: unknown): boolean {
    return (
      data !== null &&
      typeof data === 'object' &&
      'ok' in (data as Record<string, unknown>) &&
      typeof (data as Record<string, unknown>).ok === 'boolean'
    );
  }
}
