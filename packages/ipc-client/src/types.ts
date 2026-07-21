/**
 * IPC Client Types
 *
 * Electron IPC communication types for the Result-mode IPC client.
 *
 * @module @dailyuse/ipc-client
 */

// ============================================================================
// Electron Bridge (Preload 暴露的接口)
// ============================================================================

/**
 * Electron API — exposed by preload via contextBridge.
 */
export interface ElectronBridge {
  /**
   * Invoke a main-process handler and wait for the response.
   */
  invoke(channel: string, ...args: unknown[]): Promise<unknown>;

  /**
   * Listen for main-process push messages.
   */
  on(channel: string, callback: (...args: unknown[]) => void): void;

  /**
   * Remove a push-message listener.
   */
  off(channel: string, callback: (...args: unknown[]) => void): void;
}

// ============================================================================
// IPC Client Config
// ============================================================================

/**
 * ResultIpcClient configuration.
 */
export interface IpcClientConfig {
  /**
   * ElectronBridge instance from preload.
   */
  bridge: ElectronBridge;

  /**
   * Enable invoke logging (dev only).
   * @default false
   */
  enableLogging?: boolean;

  /**
   * Invoke timeout in milliseconds.
   * @default 30000
   */
  timeout?: number;

  /**
   * Retry once after timeout.
   * @default false
   */
  retryOnTimeout?: boolean;
}

/**
 * Default config for ResultIpcClient.
 */
export const DEFAULT_IPC_CLIENT_CONFIG: Required<
  Pick<IpcClientConfig, 'enableLogging' | 'timeout' | 'retryOnTimeout'>
> = {
  enableLogging: false,
  timeout: 30_000,
  retryOnTimeout: false,
};
