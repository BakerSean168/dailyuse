/**
 * Governance Module — Adapter Types.
 * 治理模块 —— 适配器类型。
 *
 * Local transport interfaces for dependency inversion at the transport layer.
 * 传输层依赖倒置的本地传输接口。
 *
 * Each module defines its own transport interfaces (IResultHttpClient, IResultIpcClient)
 * and accepts injected implementations from the App level. This avoids coupling to
 * specific HTTP/IPC libraries at the package level.
 * 每个模块定义自己的传输接口（IResultHttpClient、IResultIpcClient），
 * 并从应用层接受注入的实现。这避免了在包级别耦合具体的 HTTP/IPC 库。
 *
 * Re-exported types:
 * 重新导出的类型：
 * - IRuleApiClient: port interface that HTTP/IPC adapters both implement
 *   IRuleApiClient：HTTP 和 IPC 适配器共同实现的端口接口
 * - Request/Response types: from contracts/api for type-safe transport
 *   请求/响应类型：来自 contracts/api，用于类型安全的传输
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IResultHttpClient } from '@dailyuse/http-client';

// Re-export the port interface
export type { IRuleApiClient } from '../../contracts/api/rule-api-client.port';

// Re-export API types used by adapters
export type {
  CreateRuleReq,
  CreateRuleRes,
  GetRuleReq,
  GetRuleRes,
  UpdateRuleReq,
  UpdateRuleRes,
  DeleteRuleReq,
  DeleteRuleRes,
  ListRulesQuery,
  ListRulesRes,
  SearchRulesQuery,
  SearchRulesRes,
} from '../../contracts/api/rules';
export type {
  GetRuleRevisionsQuery,
  GetRuleRevisionsRes,
} from '../../contracts/api/rule-revisions';

// IResultHttpClient imported from @dailyuse/http-client

export type { IResultHttpClient };

/**
 * IPC Client interface (Result-returning).
 * IPC 客户端接口（返回 Result 类型）。
 *
 * Satisfied by ResultIpcClient from @dailyuse/ipc-client at the App level.
 * 在应用层由 @dailyuse/ipc-client 的 ResultIpcClient 满足。
 */
export interface IResultIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<Result<T>>;
}
