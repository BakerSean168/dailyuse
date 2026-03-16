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

// Deprecated — kept for backward compat only
// 已废弃 — 仅保留向后兼容
export { registerRepositoryInitializationTasks } from './initialization';
