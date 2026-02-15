/**
 * Delete Rule
 *
 * 删除规则用例
 */

import type { Result } from '@dailyuse/contracts/result';
import type { DeleteRuleReq, DeleteRuleRes } from '@/contracts/api/rules';
import type { IRuleApiClient } from '@/contracts/api/rule-api-client.port';

/**
 * Delete Rule
 */
export class DeleteRule {
  private static instance: DeleteRule;

  private constructor(private readonly apiClient: IRuleApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient: IRuleApiClient): DeleteRule {
    DeleteRule.instance = new DeleteRule(apiClient);
    return DeleteRule.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(apiClient?: IRuleApiClient): DeleteRule {
    if (!DeleteRule.instance) {
      if (!apiClient) {
        throw new Error('DeleteRule: API client is required for initial instance creation');
      }
      DeleteRule.instance = DeleteRule.createInstance(apiClient);
    }
    return DeleteRule.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DeleteRule.instance = undefined as unknown as DeleteRule;
  }

  /**
   * 执行用例：删除规则
   */
  async execute(req: DeleteRuleReq): Promise<Result<DeleteRuleRes>> {
    return this.apiClient.deleteRule(req);
  }
}
