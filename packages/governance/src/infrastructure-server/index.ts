/**
 * Infrastructure Server Layer - Barrel Export.
 * 基础设施服务端层 - 统一导出。
 *
 * Server-side infrastructure:
 * 服务端基础设施：
 * - Repository implementations (Prisma, PowerSync)
 *   仓储实现（Prisma、PowerSync）
 * - Persistence mappers
 *   持久化映射器
 * - Explicit composition root and runtime assembly
 *   显式组合根与运行时组装
 */

// ============ Adapters - Prisma ============
/** @internal Concrete Prisma implementation — use IRuleRepository interface instead. Prisma 具体实现 — 请使用 IRuleRepository 接口。 */
export { RulePrismaRepository } from './adapters/prisma/rule-prisma.repository';
/** @internal Concrete Prisma implementation — use IRuleRevisionRepository interface instead. Prisma 具体实现 — 请使用 IRuleRevisionRepository 接口。 */
export { RuleRevisionPrismaRepository } from './adapters/prisma/rule-revision-prisma.repository';

// ============ Adapters - PowerSync ============
/** @internal Concrete PowerSync implementation — use repository interfaces instead. PowerSync 具体实现 — 请使用仓储接口。 */
export { PowerSyncRuleRepository, PowerSyncRuleRevisionRepository } from './adapters/powersync';

// ============ Composition Root ============
export {
  createGovernanceModule,
  createGovernanceUseCases,
  type GovernanceApplicationPort,
  type GovernanceModuleDependencies,
  type GovernanceModuleInstance,
  type GovernanceModuleRuntimeContribution,
  type GovernanceModuleUseCases,
} from './governance.module';
export { createGovernancePowerSyncModule } from './powersync';
