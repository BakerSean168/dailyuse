/**
 * Governance Module - Adapter Types.
 * 治理模块 - 适配器类型。
 *
 * Local transport interfaces for dependency inversion.
 * 用于依赖倒置的本地传输接口。
 * Modules define their own transport interfaces and accept injected implementations.
 * 模块定义自己的传输接口并接受注入的实现。
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
