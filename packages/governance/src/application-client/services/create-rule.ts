/**
 * Create Rule
 *
 * 创建规则用例
 */

import type { Result } from '@dailyuse/contracts/result';
import type { CreateRuleReq } from '../../contracts/api/rules';
import { Rule } from '../../domain-client/aggregates/rule';
import type { IRuleApiClient } from '../../contracts/api/rule-api-client.port';
import { ruleFromDTO } from '../mappers/rule-dto-mapper';

/**
 * Create Rule
 */
export class CreateRule {
  private static instance: CreateRule;

  private constructor(private readonly apiClient: IRuleApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient: IRuleApiClient): CreateRule {
    CreateRule.instance = new CreateRule(apiClient);
    return CreateRule.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(apiClient?: IRuleApiClient): CreateRule {
    if (!CreateRule.instance) {
      if (!apiClient) {
        throw new Error('CreateRule: API client is required for initial instance creation');
      }
      CreateRule.instance = CreateRule.createInstance(apiClient);
    }
    return CreateRule.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CreateRule.instance = undefined as unknown as CreateRule;
  }

  /**
   * 执行用例
   */
  async execute(req: CreateRuleReq): Promise<Result<Rule>> {
    const result = await this.apiClient.createRule(req);
    if (!result.ok) return result;
    return { ok: true, data: ruleFromDTO(result.data) };
  }
}
