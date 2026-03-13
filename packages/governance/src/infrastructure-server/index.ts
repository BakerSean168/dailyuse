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
 * - DI container and composition root
 *   DI 容器和组合根
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
export { GovernanceModule, type GovernanceModuleRepositories } from './governance.module';
export { GovernancePowerSyncModule } from './powersync';
/** @internal DI container — use GovernanceModule facade instead. DI 容器 — 请使用 GovernanceModule 门面。 */
export { GovernanceContainer } from './di/governance-container';
