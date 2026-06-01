/**
 * Repository API Module
 * 仓库 API 模块
 *
 * Self-contained API module entry point, exposed to ApiBootstrapper via register().
 * 自治的 API 模块入口 — 通过 register() 暴露给 ApiBootstrapper。
 *
 * Route prefixes — 路由前缀：
 * - /repositories  (repository CRUD)
 * - /resources     (standalone resource routes)
 * - /folders       (standalone folder routes)
 */

export { RepositoryApiModule } from './module';
export type { RepositoryApiModuleContext, RepositoryApiModuleDef } from './module';
export { RepositoryController, type RepositoryUseCases } from '../controllers';
export { createRepositoryPrismaModule, createFsStorageAdapter } from './prisma';
export type { CreateRepositoryPrismaModuleOptions } from './prisma';
export { createRepositoryPowerSyncModule } from '../infrastructure-server';
export type {
  RepositoryModuleInstance,
  RepositoryModuleDependencies,
  RepositoryApplicationPort,
} from '../infrastructure-server';
