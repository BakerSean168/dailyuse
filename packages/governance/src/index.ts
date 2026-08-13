/**
 * @memoflow/governance
 *
 * 治理模块运行时根入口。
 *
 * Public governance contracts are centralized in `@memoflow/contracts/governance`.
 * Root exports are limited to the canonical server composition root.
 * Client / API / Electron seams use dedicated subpaths.
 *
 * 公共治理契约已集中到 `@memoflow/contracts/governance`。
 * 根入口暴露规范化服务端组合根及其宿主装配所需的
 * ingredient factory（`create*Repositories`）；
 * client / api / electron 使用独立子路径。
 *
 * Concrete adapter classes are never exported from this seam — hosts consume
 * repositories only through the GovernanceRepositorySet Port shape.
 *
 * 具体适配器类绝不从该 seam 导出——宿主只能通过
 * GovernanceRepositorySet Port 形状使用仓储。
 */

export {
  createGovernanceModule,
  createGovernancePrismaRepositories,
  createGovernancePowerSyncRepositories,
  type GovernanceModuleDependencies,
  type GovernanceModuleInstance,
  type GovernanceRepositorySet,
} from './server';
