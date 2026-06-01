/**
 * IPC Client Types
 *
 * Electron IPC 通信的类型定义。
 * 所有类型集中定义在此文件中，实现自包含（self-contained）。
 *
 * @module @dailyuse/ipc-client
 */

// ============================================================================
// Electron Bridge (Preload 暴露的接口)
// ============================================================================

/**
 * Electron API — 由 Preload 脚本通过 contextBridge 暴露到 window 上
 *
 * 对应 Preload 脚本中：
 * ```ts
 * contextBridge.exposeInMainWorld('electronAPI', {
 *   invoke, on, off, ...
 * })
 * ```
 *
 * 安全性：
 * - 使用 Context Isolation（上下文隔离）
 * - 仅暴露白名单内的 IPC channel
 * - 渲染进程不可直接访问 ipcRenderer
 */
export interface ElectronBridge {
  /**
   * 调用主进程 handler 并等待返回
   * 对应 ipcMain.handle(channel, handler)
   */
  invoke(channel: string, ...args: unknown[]): Promise<unknown>;

  /**
   * 监听主进程发来的消息
   * 对应 mainWindow.webContents.send(channel, data)
   */
  on(channel: string, callback: (...args: unknown[]) => void): void;

  /**
   * 移除消息监听器
   */
  off(channel: string, callback: (...args: unknown[]) => void): void;
}

/**
 * 兼容别名 — 与 infrastructure-client 中已有的 ElectronAPI 类型一致
 */
export type ElectronAPI = ElectronBridge;

// ============================================================================
// IPC Client Interface (Adapter 层使用)
// ============================================================================

/**
 * IPC Client 接口
 *
 * 与 `HttpClient` 接口对等：
 * - `HttpClient.get<T>(url)` → `Promise<T>`
 * - `IpcClient.invoke<T>(channel)` → `Promise<T>`
 *
 * 两者都返回解包后的纯数据 `T`，出错时抛出异常。
 * 这确保所有现有的 IPC Adapter（GoalIpcAdapter、TaskIpcAdapter 等）无需修改。
 */
export interface IpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
}

// ============================================================================
// IPC Client Config
// ============================================================================

/**
 * IPC Client 配置选项
 */
export interface IpcClientConfig {
  /**
   * ElectronBridge 实例（由 preload 脚本暴露）
   */
  bridge: ElectronBridge;

  /**
   * 是否开启调用日志（开发环境调试用）
   * @default false
   */
  enableLogging?: boolean;

  /**
   * 调用超时时间（毫秒）
   * 超时后返回 TIMEOUT 错误
   * @default 30000 (30s)
   */
  timeout?: number;

  /**
   * 超时后是否自动重试一次
   * @default false
   */
  retryOnTimeout?: boolean;
}

/**
 * 默认配置
 */
export const DEFAULT_IPC_CLIENT_CONFIG: Required<
  Pick<IpcClientConfig, 'enableLogging' | 'timeout' | 'retryOnTimeout'>
> = {
  enableLogging: false,
  timeout: 30_000,
  retryOnTimeout: false,
};

// ============================================================================
// IPC Error
// ============================================================================

/**
 * IPC 调用错误
 *
 * 与 `HttpClientError` 对等：
 * - `HttpClientError`: HTTP 调用失败时抛出
 * - `IpcClientError`: IPC 调用失败时抛出
 */
export class IpcClientError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly channel?: string,
    public readonly details?: unknown,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'IpcClientError';
  }
}
