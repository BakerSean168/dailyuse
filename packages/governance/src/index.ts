/**
 * @dailyuse/governance
 *
 * 治理模块 - 架构规则与代码标准的活文档库
 *
 * 【业务场景】
 * 架构治理规则管理，包含：
 * - 创建、编辑、删除规则
 * - 状态流转：Draft → Active → Deprecated
 * - 严重性管理：Mandatory / Recommended
 * - 版本追踪：RuleRevision 记录每次变更
 *
 * 【分层架构】
 *
 * ```
 * ┌─────────────────────────────────────────────────────────┐
 * │  contracts (契约层)                                      │
 * │  - 类型定义（interface/type）                            │
 * │  - DTO（Client/Server/Persistence）                     │
 * │  - 领域事件                                              │
 * │  - API Schema (Zod)                                     │
 * ├─────────────────────────────────────────────────────────┤
 * │  domain-shared (共享领域层)                              │
 * │  - 值对象工厂（ID 生成、验证）                           │
 * │  - 状态机逻辑                                            │
 * │  - 前后端可共享的业务规则                                │
 * ├─────────────────────────────────────────────────────────┤
 * │  domain-server (服务端领域层)                            │
 * │  - 聚合根（Rule）                                        │
 * │  - 仓储接口（IRuleRepository）                          │
 * │  - 领域服务（RuleDomainService）                        │
 * └─────────────────────────────────────────────────────────┘
 * ```
 *
 * 【使用示例】
 *
 * ```typescript
 * // 1. 导入契约层类型
 * import type { RuleClientDTO, RuleStatus } from '@dailyuse/governance/contracts';
 *
 * // 2. 导入值对象工厂
 * import { RuleIdFactory } from '@dailyuse/governance/domain-shared';
 *
 * // 3. 导入聚合根
 * import { Rule, IRuleRepository } from '@dailyuse/governance/domain-server';
 *
 * // 4. 使用组合根
 * import { createGovernanceModule } from '@dailyuse/governance/infrastructure-server';
 * const module = createGovernanceModule({ ruleRepository, revisionRepository });
 * const result = await module.api.createRule(props, context);
 * ```
 */

// ================= Contracts Layer (契约层) =================
// Type definitions, DTOs, Events, API Schemas
export * from './contracts';

// ================= Domain Layer (领域层) =================
// Domain-Shared: Value objects and shared logic (exported from contracts)
// Domain-Server: Aggregates, entities, repositories (server-side)
// Domain-Client: Client-side domain models (UI view models)
export { Rule } from './domain-server/aggregates/rule';
export { RuleRevision } from './domain-server/entities/rule-revision';
export * from './domain-server/repositories';
export * from './domain-server/services';

// Note: domain-client exports Rule and RuleRevision classes with same names
// Consumers should import from specific paths to avoid conflicts
// export * from './domain-client';

// ================= Application Layer (应用层) =================
// Application-Server: Use cases (server-side)
// Application-Client: Client services, view model mappers
// Note: DTOs are already exported from contracts layer
export * from './application-server';
export * from './application-client';

// ================= Infrastructure Layer (基础设施层) =================
// Infrastructure-Server: Repositories, persistence (server-side)
// Infrastructure-Client: Local storage, caching (client-side)
export {
  /** @internal Concrete Prisma implementation — use IRuleRepository interface instead. Prisma 具体实现 — 请使用 IRuleRepository 接口。 */
  RulePrismaRepository,
  /** @internal Concrete Prisma implementation — use IRuleRevisionRepository interface instead. Prisma 具体实现 — 请使用 IRuleRevisionRepository 接口。 */
  RuleRevisionPrismaRepository,
  /** @internal Concrete PowerSync implementation — use IRuleRepository interface instead. PowerSync 具体实现 — 请使用 IRuleRepository 接口。 */
  PowerSyncRuleRepository,
  /** @internal Concrete PowerSync implementation — use IRuleRevisionRepository interface instead. PowerSync 具体实现 — 请使用 IRuleRevisionRepository 接口。 */
  PowerSyncRuleRevisionRepository,
  createGovernanceModule,
  createGovernancePowerSyncModule,
  type GovernanceApplicationPort,
  type GovernanceModuleDependencies,
  type GovernanceModuleInstance,
  type GovernanceModuleRuntimeContribution,
  type GovernanceModuleUseCases,
} from './infrastructure-server';

export * from './infrastructure-client';
