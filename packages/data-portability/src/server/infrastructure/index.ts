/**
 * Data Portability Infrastructure Server Layer.
 * 数据可移植性基础设施服务端层。
 *
 * Public seam: ingredient factories, set types, module factory, runtime
 * contribution factories and port types. Concrete adapter classes (PowerSync
 * import store, Prisma server-held disclosure source) stay in their adapter
 * files and never leak through this barrel.
 *
 * 公共 seam：仅导出原料工厂、集合类型、模块工厂、运行时贡献工厂与 Port 类型。
 * 具体适配器类（PowerSync import store、Prisma server-held disclosure source）
 * 保留在各自的 adapter 文件中，不通过该 barrel 泄漏。
 */

export {
  createDataPortabilityModule,
  createDataPortabilityUseCases,
  createPowerSyncDataPortabilityModule,
  type DataPortabilityModuleDependencies,
  type DataPortabilityModuleInstance,
  type DataPortabilityModuleRuntimeContribution,
  type DataPortabilityModuleUseCases,
} from './data-portability.module';
export type { DataPortabilityApplicationPort } from '../application';
export type { DataPortabilityDependencies } from '../application/data-portability.dependencies';
export type { DataPortabilityImportStore } from '../application/import-store/data-portability-import-store';
export {
  createDataPortabilityPrismaModule,
  createPrismaDataPortabilityDependencies,
  createPrismaDataPortabilityImportStore,
  type CreateDataPortabilityPrismaModuleOptions,
  type DataPortabilityRepositorySet,
} from './prisma';
export {
  createPowerSyncDataPortabilityDependencies,
} from './powersync/powersync-export-dependencies';
export {
  createPowerSyncDataPortabilityImportStore,
} from './powersync/powersync-import-store';
export {
  createDataPortabilityRuntimeContribution,
} from './runtime';
export { createPrismaServerHeldDataDisclosureApplicationPort } from './server-held-data-disclosure';
