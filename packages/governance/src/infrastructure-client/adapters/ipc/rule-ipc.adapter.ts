/**
 * Rule IPC Adapter.
 * 规则 IPC 适配器。
 *
 * Electron IPC implementation of IRuleApiClient for desktop apps.
 * 面向 Electron 桌面应用的 IRuleApiClient IPC 实现。
 *
 * Delegates all IPC communication to IResultIpcClient, which wraps
 * Electron's ipcRenderer.invoke() with Result<T> return types.
 * 将所有 IPC 通信委托给 IResultIpcClient，后者包装了 Electron 的 ipcRenderer.invoke()
 * 并返回 Result<T> 类型。
 *
 * Channel naming convention: uses GovernanceChannels constants from @dailyuse/contracts/electron.
 * Channel 命名规范：使用 @dailyuse/contracts/electron 中的 GovernanceChannels 常量。
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
  * @param private readonly ipcClient - 
 */
export class RuleIpcAdapter implements IRuleApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  // ===== Rule CRUD =====

  /** @see IRuleApiClient.createRule */
  async createRule(req: CreateRuleReq): Promise<Result<CreateRuleRes>> {
    return this.ipcClient.invoke(GovernanceChannels.RULE_CREATE, req);
  }

  /** @see IRuleApiClient.getRule */
  async getRule(req: GetRuleReq): Promise<Result<GetRuleRes>> {
    return this.ipcClient.invoke(GovernanceChannels.RULE_GET, req);
  }

  /** @see IRuleApiClient.updateRule */
  async updateRule(ruleId: string, req: UpdateRuleReq): Promise<Result<UpdateRuleRes>> {
    return this.ipcClient.invoke(GovernanceChannels.RULE_UPDATE, { ruleId, ...req });
  }

  /** @see IRuleApiClient.deleteRule */
  async deleteRule(req: DeleteRuleReq): Promise<Result<DeleteRuleRes>> {
    return this.ipcClient.invoke(GovernanceChannels.RULE_DELETE, req);
  }

  /** @see IRuleApiClient.listRules */
  async listRules(query?: ListRulesQuery): Promise<Result<ListRulesRes>> {
    return this.ipcClient.invoke(GovernanceChannels.RULE_LIST, query);
  }

  /** @see IRuleApiClient.searchRules */
  async searchRules(query: SearchRulesQuery): Promise<Result<SearchRulesRes>> {
    return this.ipcClient.invoke(GovernanceChannels.RULE_SEARCH, query);
  }

  /** @see IRuleApiClient.getRevisions */
  async getRevisions(query: GetRuleRevisionsQuery): Promise<Result<GetRuleRevisionsRes>> {
    return this.ipcClient.invoke(GovernanceChannels.RULE_REVISIONS, query);
  }
}

/** Factory that creates a RuleIpcAdapter wrapping the given IPC client.  * @param ipcClient - 
  * @returns any - 
 */
export function createRuleIpcAdapter(ipcClient: IResultIpcClient): IRuleApiClient {
  return new RuleIpcAdapter(ipcClient);
}
