/**
 * GovernanceContainer — Singleton DI container.
 * GovernanceContainer — 单例依赖注入容器。
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
 * @internal Low-level DI container — consumers should use GovernanceModule facade instead.
 * @internal 底层 DI 容器 — 消费者应使用 GovernanceModule 门面。
 *
 * @see {@link GovernanceModule} Use the composition root facade for dependency injection.
 * @see {@link GovernanceModule} 使用组合根门面进行依赖注入。
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
