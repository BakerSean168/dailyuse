/**
 * @dailyuse/ipc-client — 统一 IPC 客户端包
 *
 * 提供 Result 模式的 IPC 客户端，与 @dailyuse/http-client 完美对称：
 *
 * | 风格             | HTTP 版                    | IPC 版                     |
 * |-----------------|----------------------------|----------------------------|
 * | Result 模式      | `ResultHttpClient`         | `ResultIpcClient`          |
 * | Result 工厂      | `createResultHttpClient()` | `createResultIpcClient()`  |
 *
 * 所有方法都返回 `Promise<Result<T>>`，永不抛出异常。
 *
 * @module @dailyuse/ipc-client
 *
 * @example
 * ```ts
 * import { createResultIpcClient } from '@dailyuse/ipc-client';
 *
 * const ipc = createResultIpcClient({ bridge: window.electronAPI });
 * const result = await ipc.invoke<Goal[]>('goal:list');
 *
 * if (result.ok) {
 *   console.log(result.data); // Goal[]
 * } else {
 *   console.error(result.error.message); // 无需 try-catch
 * }
 * ```
 */

// ── Types ──
export type {
  ElectronBridge,
  IpcClientConfig,
} from './types';
export {
  IpcClientError,
  DEFAULT_IPC_CLIENT_CONFIG,
} from './types';

// ── Result IPC Client ──
export { ResultIpcClient } from './result-ipc-client';

// ── 便捷工厂函数 ──
import type { IpcClientConfig } from './types';
import { ResultIpcClient } from './result-ipc-client';

/**
 * 创建 ResultIpcClient 实例
 *
 * 返回的实例所有方法都返回 `Promise<Result<T>>`，永不抛出异常。
 * 等价于 HTTP 侧的 `createResultHttpClient()`。
 */
export function createResultIpcClient(config: IpcClientConfig): ResultIpcClient {
  return new ResultIpcClient(config);
}
