/**
 * Governance server infrastructure layer barrel.
 * Governance 服务端基础设施层统一导出。
 *
 * This barrel exports the infrastructure slice of the server runtime.
 * 本 barrel 只导出服务端运行时的基础设施切片。
 *
 * Expected folder structure:
 * 期望目录结构：
 *
 * ```
 * server/infrastructure/
 *   adapters/
 *     prisma/
 *       mappers/           ← Entity ↔ Prisma row mapping
 *       <entity>-prisma.repository.ts
 *     powersync/
 *       mappers/           ← Entity ↔ SQLite row mapping
 *       <entity>-powersync.repository.ts
 *      *   runtime/
 *     module-runtime.ts    ← Runtime adapter seam
 *     governance-event-log.runtime.ts
 *   governance.module.ts   ← Canonical composition root
 *   prisma.ts              ← Prisma convenience composition root
 *   powersync.ts           ← PowerSync convenience composition root
 *   index.ts               ← This barrel file
 * ```
 */

export {
  createGovernanceModule,
  type GovernanceModuleDependencies,
  type GovernanceModuleInstance,
} from './governance.module';
export {
  createGovernancePrismaModule,
  createGovernancePrismaRepositories,
  type GovernanceRepositorySet,
} from './prisma';
export {
  createGovernancePowerSyncModule,
  createGovernancePowerSyncRepositories,
} from './powersync';
export { createGovernanceEventLogRuntime } from './runtime';