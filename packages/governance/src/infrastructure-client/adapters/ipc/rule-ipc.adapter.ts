/**
 * Rule IPC Adapter
 *
 * IPC implementation of IRuleApiClient for Electron desktop.
 * Communicates with main process which handles actual data operations.
 */

import type {
  IRuleApiClient,
  IIpcClient,
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
} from '../types';

/**
 * Rule IPC Adapter
 *
 * Implements IRuleApiClient using Electron IPC for desktop app.
 */
export class RuleIpcAdapter implements IRuleApiClient {
  private readonly channel = 'governance:rule';

  constructor(private readonly ipcClient: IIpcClient) {}

  // ===== Rule CRUD =====

  async createRule(req: CreateRuleReq): Promise<CreateRuleRes> {
    return this.ipcClient.invoke(`${this.channel}:create`, req);
  }

  async getRule(req: GetRuleReq): Promise<GetRuleRes> {
    return this.ipcClient.invoke(`${this.channel}:get`, req);
  }

  async updateRule(ruleId: string, req: UpdateRuleReq): Promise<UpdateRuleRes> {
    return this.ipcClient.invoke(`${this.channel}:update`, { ruleId, ...req });
  }

  async deleteRule(req: DeleteRuleReq): Promise<DeleteRuleRes> {
    return this.ipcClient.invoke(`${this.channel}:delete`, req);
  }

  async listRules(query?: ListRulesQuery): Promise<ListRulesRes> {
    return this.ipcClient.invoke(`${this.channel}:list`, query);
  }

  async searchRules(query: SearchRulesQuery): Promise<SearchRulesRes> {
    return this.ipcClient.invoke(`${this.channel}:search`, query);
  }
}

export function createRuleIpcAdapter(ipcClient: IIpcClient): IRuleApiClient {
  return new RuleIpcAdapter(ipcClient);
}
