/**
 * @dailyuse/ipc-client — 统一 IPC 客户端包
 *
 * 提供两种风格的 IPC 客户端，与 @dailyuse/http-client 完美对称：
 *
 * | 风格             | HTTP 版                | IPC 版               |
 * |-----------------|------------------------|----------------------|
 * | 抛异常（DI 兼容） | `AxiosHttpClient`      | `IpcClientImpl`      |
 * | Result 模式      | `ResultHttpClient`     | `ResultIpcClient`    |
 * | 工厂函数         | `createHttpClient()`   | `createIpcClient()`  |
 * | Result 工厂      | `createResultHttpClient()` | `createResultIpcClient()` |
 *
 * 这两个包共同实现了"类 tRPC"的统一接口：
 * - **入参**: 强类型请求对象
 * - **出参**: `Result<T>` — 永不抛出异常
 * - **错误**: 自动处理底层通信错误
 *
 * @module @dailyuse/ipc-client
 *
 * @example
 * ```ts
 * // ── 方式 1: 与现有 IPC Adapter 兼容 ──
 * import { createIpcClient } from '@dailyuse/ipc-client';
 *
 * const ipcClient = createIpcClient();
 * // IPC Adapter 内部使用:
 * const goals = await ipcClient.invoke<Goal[]>('goal:list');
 *
 * // ── 方式 2: 新代码使用 Result 模式 ──
 * import { createResultIpcClient } from '@dailyuse/ipc-client';
 *
 * const ipc = createResultIpcClient();
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
  ElectronAPI,
  IpcClient,
  IpcClientConfig,
} from './types';
export {
  IpcClientError,
  DEFAULT_IPC_CLIENT_CONFIG,
  getElectronBridge,
  getElectronAPI,
} from './types';

// ── IpcClient 实现（兼容现有 IPC Adapter）──
export { IpcClientImpl } from './ipc-client';

// ── Result IPC Client（新代码推荐）──
export { ResultIpcClient } from './result-ipc-client';

// ── 便捷工厂函数 ──
import type { IpcClientConfig } from './types';
import { IpcClientImpl } from './ipc-client';
import { ResultIpcClient } from './result-ipc-client';

/**
 * 创建 IpcClient 实例
 *
 * 返回的实例实现了 `IpcClient` 接口，兼容现有 IPC Adapter。
 * 自动解包 IpcResult 信封，返回纯数据 `T`，失败时抛出 `IpcClientError`。
 *
 * 等价于 HTTP 侧的 `createHttpClient()`。
 */
export function createIpcClient(config?: IpcClientConfig): IpcClientImpl {
  return new IpcClientImpl(config);
}

/**
 * 创建 ResultIpcClient 实例
 *
 * 返回的实例所有方法都返回 `Promise<Result<T>>`，永不抛出异常。
 * 等价于 HTTP 侧的 `createResultHttpClient()`。
 */
export function createResultIpcClient(config?: IpcClientConfig): ResultIpcClient {
  return new ResultIpcClient(config);
}
