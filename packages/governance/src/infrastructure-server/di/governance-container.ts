/**
 * GovernanceContainer — legacy singleton DI container.
 * GovernanceContainer —— 遗留单例依赖注入容器。
 *
 * Manages Repository bindings for the Governance module:
 * 管理 Governance 模块的仓储绑定：
 * - Runtime registration of Repository implementations
 *   运行时注册 Repository 实现
 * - Runtime resolution with null-safety checks
 *   运行时获取（带空值校验，确保已注册）
 * - reset() for test scenarios with mock implementations
 *   支持 reset() 用于测试场景替换 Mock 实现
 *
 * @deprecated The governance module no longer uses this container internally.
 *             It is kept only for backward compatibility with older callers.
 * @deprecated Governance 模块内部已不再使用该容器；当前仅为兼容旧调用方保留。
 *
 * @see {@link createGovernanceModule} Use the composition root factory for dependency injection.
 * @see {@link createGovernanceModule} 使用组合根工厂进行依赖注入。
 */

import type { IRuleRepository, IRuleRevisionRepository } from '../../domain-server';

export class GovernanceContainer {
  private static instance: GovernanceContainer;
  private ruleRepository?: IRuleRepository;
  private revisionRepository?: IRuleRevisionRepository;

  private constructor() {}

  /** 获取单例实例 */
  static getInstance(): GovernanceContainer {
    if (!GovernanceContainer.instance) {
      GovernanceContainer.instance = new GovernanceContainer();
    }
    return GovernanceContainer.instance;
  }

  /** 注册 Rule Repository 实现 */
  setRuleRepository(repository: IRuleRepository): void {
    this.ruleRepository = repository;
  }

  /** 注册 RuleRevision Repository 实现 */
  setRevisionRepository(repository: IRuleRevisionRepository): void {
    this.revisionRepository = repository;
  }

  /** 获取 Rule Repository（未注册时抛出错误） */
  getRuleRepository(): IRuleRepository {
    if (!this.ruleRepository) {
      throw new Error('RuleRepository not registered in GovernanceContainer');
    }
    return this.ruleRepository;
  }

  /** 获取 RuleRevision Repository（未注册时抛出错误） */
  getRevisionRepository(): IRuleRevisionRepository {
    if (!this.revisionRepository) {
      throw new Error('RuleRevisionRepository not registered in GovernanceContainer');
    }
    return this.revisionRepository;
  }

  /** 重置全部绑定（用于测试或重新初始化） */
  reset(): void {
    this.ruleRepository = undefined;
    this.revisionRepository = undefined;
  }
}
