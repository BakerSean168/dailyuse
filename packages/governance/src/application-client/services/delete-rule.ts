/**
 * Delete Rule
 *
 * 删除规则用例
 */

import type { Result } from '@dailyuse/contracts/result';
import type { DeleteRuleReq, DeleteRuleRes } from '../../contracts/api/rules';
import type { IRuleApiClient } from '../../contracts/api/rule-api-client.port';

/**
 * Delete Rule
 *
 * Use case for deleting rules via HTTP API. Requires IRuleApiClient dependency
 * injected via constructor for proper separation of concerns and testability.
 */
export class DeleteRule {
  constructor(private readonly apiClient: IRuleApiClient) {}

  /**
   * Execute: Delete rule via API
   */
  async execute(req: DeleteRuleReq): Promise<Result<DeleteRuleRes>> {
    return this.apiClient.deleteRule(req);
  }
}
