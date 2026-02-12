/**
 * Governance Module - Adapter Types
 *
 * Local transport interfaces for dependency inversion.
 * Modules define their own transport interfaces and accept injected implementations.
 */

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

/**
 * HTTP Client interface - local abstraction over HTTP transport
 */
export interface IHttpClient {
  get<T = any>(url: string, config?: { params?: any }): Promise<T>;
  post<T = any>(url: string, data?: any): Promise<T>;
  patch<T = any>(url: string, data?: any): Promise<T>;
  delete<T = any>(url: string): Promise<T>;
}

/**
 * IPC Client interface - local abstraction over IPC transport (Electron)
 */
export interface IIpcClient {
  invoke<T = any>(channel: string, ...args: any[]): Promise<T>;
}
