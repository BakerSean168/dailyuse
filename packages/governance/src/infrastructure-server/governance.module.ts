/**
 * GovernanceModule — Composition Root（组合根）
 *
 * 【规范说明：模块组合根模式 - 参考 governance 活文档】
 *
 * 组合根是依赖注入的入口点，负责：
 * 1. 接收外部传入的 Repository 实现（遵循依赖倒置原则）
 * 2. 将实现注册到 DI 容器（GovernanceContainer）
 * 3. 实例化并暴露全部 Use Case
 *
 * 【设计原则】
 * - 依赖倒置：模块只依赖 Repository 接口，不依赖具体实现
 * - 单一职责：仅负责组装，不包含业务逻辑
 * - 显式依赖：通过构造函数注入所有依赖
 *
 * 【使用示例】
 * ```typescript
 * const module = new GovernanceModule({
 *   ruleRepository: new RulePrismaRepository(prisma),
 *   revisionRepository: new RuleRevisionPrismaRepository(prisma),
 * });
 *
 * // 使用 use case
 * const result = await module.createRule.execute(props, context);
 * ```
 *
 * @see {@link GovernanceContainer} DI 容器单例
 * @see {@link CreateRuleUseCase} 等 6 个 Use Case
 */

import type { IRuleRepository, IRuleRevisionRepository } from '../domain-server';
import {
  CreateRuleUseCase,
  UpdateRuleUseCase,
  DeleteRuleUseCase,
  GetRuleUseCase,
  ListRulesUseCase,
  GetRuleRevisionsUseCase,
} from '../application-server';
import { GovernanceContainer } from './di/governance-container';

/** 构造 GovernanceModule 所需的 Repository 依赖 */
export interface GovernanceModuleRepositories {
  readonly ruleRepository: IRuleRepository;
  readonly revisionRepository: IRuleRevisionRepository;
}

export class GovernanceModule {
  public readonly ruleRepository: IRuleRepository;
  public readonly revisionRepository: IRuleRevisionRepository;

  // ================= Use Cases =================
  public readonly createRule: CreateRuleUseCase;
  public readonly updateRule: UpdateRuleUseCase;
  public readonly deleteRule: DeleteRuleUseCase;
  public readonly getRule: GetRuleUseCase;
  public readonly listRules: ListRulesUseCase;
  public readonly getRevisions: GetRuleRevisionsUseCase;

  constructor(repositories: GovernanceModuleRepositories) {
    // 注册 Repository 实现到 DI 容器
    const container = GovernanceContainer.getInstance();
    container.reset();
    container.setRuleRepository(repositories.ruleRepository);
    container.setRevisionRepository(repositories.revisionRepository);

    this.ruleRepository = container.getRuleRepository();
    this.revisionRepository = container.getRevisionRepository();

    // 实例化全部 Use Case（命令 + 查询）
    this.createRule = new CreateRuleUseCase(this.ruleRepository);
    this.updateRule = new UpdateRuleUseCase(this.ruleRepository);
    this.deleteRule = new DeleteRuleUseCase(this.ruleRepository);
    this.getRule = new GetRuleUseCase(this.ruleRepository);
    this.listRules = new ListRulesUseCase(this.ruleRepository);
    this.getRevisions = new GetRuleRevisionsUseCase(this.revisionRepository);
  }
}
