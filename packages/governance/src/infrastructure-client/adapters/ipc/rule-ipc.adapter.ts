/**
 * Rule IPC Adapter.
 * 规则 IPC 适配器。
 *
 * IPC implementation of IRuleApiClient for Electron desktop.
 * 面向 Electron 桌面端的 IRuleApiClient IPC 实现。
 * Communicates with main process which handles actual data operations.
 * 与处理实际数据操作的主进程通信。
 */

import type { Result } from '@dailyuse/contracts/result';
import { GovernanceChannels } from '@dailyuse/contracts/electron';
import type {
  IRuleApiClient,
  IResultIpcClient,
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
  GetRuleRevisionsQuery,
  GetRuleRevisionsRes,
} from '../types';

/**
 * Rule IPC Adapter.
 * 规则 IPC 适配器。
 *
 * Implements IRuleApiClient using Electron IPC for desktop app.
 * 使用 Electron IPC 为桌面应用实现 IRuleApiClient。
 */
export class RuleIpcAdapter implements IRuleApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  // ===== Rule CRUD =====

  async createRule(req: CreateRuleReq): Promise<Result<CreateRuleRes>> {
    return this.ipcClient.invoke(GovernanceChannels.RULE_CREATE, req);
  }

  async getRule(req: GetRuleReq): Promise<Result<GetRuleRes>> {
    return this.ipcClient.invoke(GovernanceChannels.RULE_GET, req);
  }

  async updateRule(ruleId: string, req: UpdateRuleReq): Promise<Result<UpdateRuleRes>> {
    return this.ipcClient.invoke(GovernanceChannels.RULE_UPDATE, { ruleId, ...req });
  }

  async deleteRule(req: DeleteRuleReq): Promise<Result<DeleteRuleRes>> {
    return this.ipcClient.invoke(GovernanceChannels.RULE_DELETE, req);
  }

  async listRules(query?: ListRulesQuery): Promise<Result<ListRulesRes>> {
    return this.ipcClient.invoke(GovernanceChannels.RULE_LIST, query);
  }

  async searchRules(query: SearchRulesQuery): Promise<Result<SearchRulesRes>> {
    return this.ipcClient.invoke(GovernanceChannels.RULE_SEARCH, query);
  }

  async getRevisions(query: GetRuleRevisionsQuery): Promise<Result<GetRuleRevisionsRes>> {
    return this.ipcClient.invoke(GovernanceChannels.RULE_REVISIONS, query);
  }
}

export function createRuleIpcAdapter(ipcClient: IResultIpcClient): IRuleApiClient {
  return new RuleIpcAdapter(ipcClient);
}
