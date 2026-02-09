/**
 * Rule IPC Adapter
 * 
 * IPC implementation of IRuleApiClient for Electron desktop.
 * Communicates with main process which handles actual data operations.
 */

import type { IRuleApiClient } from '@/contracts/api/rule-api-client.port';
import type {
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
} from '@/contracts/api';

/**
 * IPC Client Interface
 * 最小化 IPC 客户端接口定义
 */
export interface IpcClient {
  invoke<T = any>(channel: string, ...args: any[]): Promise<T>;
}

/**
 * Rule IPC Adapter
 * 
 * Implements IRuleApiClient using Electron IPC for desktop app.
 */
export class RuleIpcAdapter implements IRuleApiClient {
  private readonly channel = 'governance:rule';

  constructor(private readonly ipcClient: IpcClient) {}

  // ===== Rule CRUD =====

  /**
   * 创建规则
   */
  async createRule(req: CreateRuleReq): Promise<CreateRuleRes> {
    return this.ipcClient.invoke(`${this.channel}:create`, req);
  }

  /**
   * 获取单个规则（通过 ID 或 code）
   */
  async getRule(req: GetRuleReq): Promise<GetRuleRes> {
    return this.ipcClient.invoke(`${this.channel}:get`, req);
  }

  /**
   * 更新规则
   */
  async updateRule(ruleId: string, req: UpdateRuleReq): Promise<UpdateRuleRes> {
    return this.ipcClient.invoke(`${this.channel}:update`, { ruleId, ...req });
  }

  /**
   * 删除规则
   */
  async deleteRule(req: DeleteRuleReq): Promise<DeleteRuleRes> {
    return this.ipcClient.invoke(`${this.channel}:delete`, req);
  }

  /**
   * 列出规则（带过滤和分页）
   */
  async listRules(query?: ListRulesQuery): Promise<ListRulesRes> {
    return this.ipcClient.invoke(`${this.channel}:list`, query);
  }

  /**
   * 搜索规则（关键词搜索）
   */
  async searchRules(query: SearchRulesQuery): Promise<SearchRulesRes> {
    return this.ipcClient.invoke(`${this.channel}:search`, query);
  }
}

/**
 * Factory function to create Rule IPC Adapter
 */
export function createRuleIpcAdapter(ipcClient: IpcClient): IRuleApiClient {
  return new RuleIpcAdapter(ipcClient);
}
