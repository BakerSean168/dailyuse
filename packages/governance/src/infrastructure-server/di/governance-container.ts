/**
 * GovernanceContainer — 依赖注入容器（Singleton）
 *
 * 【规范说明：DI 容器模式 - 参考 governance 活文档】
 *
 * 单例容器，负责管理 Governance 模块的 Repository 绑定：
 * - 运行时注册 Repository 实现
 * - 运行时获取 Repository（带空值校验，确保已注册）
 * - 支持 reset() 用于测试场景替换 Mock 实现
 *
 * 【设计原则】
 * - Singleton：全局唯一实例，保证绑定一致性
 * - 运行时校验：未注册时抛出明确错误，快速暴露配置问题
 * - 可测试性：`reset()` 允许在测试中替换为 Mock Repository
 *
 * @see {@link GovernanceModule} 在组合根中使用容器完成依赖注入
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
