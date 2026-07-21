/**
 * Repository API Module
 * 仓库 API 模块
 *
 * Self-contained API module entry point, exposed to ApiBootstrapper via register().
 * 自治的 API 模块入口 — 通过 register() 暴露给 ApiBootstrapper。
 *
 * Route prefix:
 * - /repositories — GitHub knowledge repository connections, projections,
 *   attachments, and confirmed create only. Legacy database Repository/Folder/
 *   Resource CRUD route builders have been removed.
 */

export { RepositoryApiModule, createRepositoryApiModule } from './module';
export type {
  CreateRepositoryApiModuleOptions,
  RepositoryApiModuleContext,
  RepositoryApiModuleDef,
} from './module';
