/**
 * @dailyuse/governance
 *
 * 治理模块运行时根入口。
 *
 * Public governance contracts are centralized in `@dailyuse/contracts/governance`.
 * Root exports are limited to the canonical server composition root.
 * Client / API / Electron seams use dedicated subpaths.
 *
 * 公共治理契约已集中到 `@dailyuse/contracts/governance`。
 * 根入口只暴露规范化服务端组合根；client / api / electron 使用独立子路径。
 */

export {
  createGovernanceModule,
  type GovernanceModuleDependencies,
  type GovernanceModuleInstance,
} from './server';
