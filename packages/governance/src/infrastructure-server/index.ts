/**
 * Infrastructure Server Layer — Barrel Export.
 * 基础设施服务端层 —— 统一导出。
 *
 * This barrel exports the public surface of the server-side infrastructure layer.
 * 本 barrel 导出服务端基础设施层的公开接口。
 *
 * Expected folder structure for each module's infrastructure-server:
 * 每个模块 infrastructure-server 的标准文件夹结构：
 *
 * ```
 * infrastructure-server/
 *   adapters/
 *     prisma/
 *       mappers/           ← Entity ↔ Prisma row mapping
 *       <entity>-prisma.repository.ts
 *     powersync/
 *       mappers/           ← Entity ↔ SQLite row mapping
 *       <entity>-powersync.repository.ts
 *     mapper-helpers.ts    ← Shared parsing utilities
 *   <module>.module.ts     ← Composition root (create<Module>Module factory)
 *   powersync.ts           ← PowerSync convenience composition root (optional)
 *   index.ts               ← This barrel file
 * ```
 *
 * Export organization:
 * 导出组织原则：
 * - Concrete repository implementations are marked @internal — use domain interfaces instead
 *   具体仓储实现标记为 @internal —— 请改用领域接口
 * - Composition root types (ModuleDependencies, ModuleInstance, ApplicationPort) are public
 *   组合根类型（ModuleDependencies、ModuleInstance、ApplicationPort）为公开 API
 * - Factory functions (create<Module>Module) are the primary entry point
 *   工厂函数（create<Module>Module）是主要入口点
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
