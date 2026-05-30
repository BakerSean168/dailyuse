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
// Domain-Shared: Value objects and shared logic.
// Root barrel intentionally exposes only stable, public-facing pieces.
// Domain-server implementation details (aggregates, concrete repositories, services)
// are NOT re-exported from the package root to keep the public surface narrow.
// Branded ID factories (RuleId, RuleRevisionId) and VO classes (RuleTag, CodeSnippet)
// are available from '@dailyuse/governance/domain-shared' — not re-exported here
// because contracts/primitives already exports the type-only branded ID types.
// Enums (Language, SnippetType, ChangeType, RuleStatus, RuleSeverity) are already
// re-exported via './contracts/value-objects'.
// Consumers who need concrete implementations should import from specific subpaths
// e.g. '@dailyuse/governance/domain-shared' or '@dailyuse/governance/domain-server'

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
// Stable composition root types only — concrete adapters are NOT re-exported
// from the root barrel. Consumers should import from specific subpaths:
//   @dailyuse/governance/infrastructure-server  (server adapters + module factory)
//   @dailyuse/governance/infrastructure-client  (client adapters)
export {
  createGovernanceModule,
  createGovernancePowerSyncModule,
  type GovernanceApplicationPort,
  type GovernanceModuleDependencies,
  type GovernanceModuleInstance,
  type GovernanceModuleRuntimeContribution,
  type GovernanceModuleUseCases,
} from './infrastructure-server';
