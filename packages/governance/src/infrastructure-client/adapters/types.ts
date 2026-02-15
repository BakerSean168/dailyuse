/**
 * Governance Module - Adapter Types
 *
 * Local transport interfaces for dependency inversion.
 * Modules define their own transport interfaces and accept injected implementations.
 */

import type { IResultHttpClient } from '@dailyuse/http-client';

// Re-export the port interface
export type { IRuleApiClient } from '@/contracts/api/rule-api-client.port';

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
} from '@/contracts/api/rules';

// IResultHttpClient imported from @dailyuse/http-client

export type { IResultHttpClient };

/**
 * IPC Client interface - local abstraction over IPC transport (Electron)
 */
export interface IIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
}
