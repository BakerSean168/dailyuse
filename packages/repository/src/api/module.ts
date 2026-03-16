/**
 * Repository API Module Definition
 * 仓库 API 模块定义
 *
 * Implements IApiModule standard interface with the 3-step pattern:
 * 实现 IApiModule 标准接口的三步模式：
 *
 * 1. Composition Root — assemble dependencies → module instance
 *    组合根 — 组装依赖 → 模块实例
 * 2. Transport handler wiring (thin mapping)
 *    传输层处理器接线（简单映射）
 * 3. Route mounting
 *    路由挂载
 *
 * All use case instantiation lives in the composition root
 * (`createRepositoryModule`), NOT here.
 *
 * 所有 use case 的实例化都在组合根 (`createRepositoryModule`) 中完成，
 * 不在此文件中。
 *
 * Middleware comes from context.middleware, no dependency on apps/api internals.
 * 中间件来自 context.middleware，不依赖 apps/api 内部实现。
 */

import { Router } from 'express';
import type { PrismaClient } from '@dailyuse/database';
import { createRepositoryModule, type RepositoryModuleInstance } from '../infrastructure-server';
import { ResourceBookmarkPrismaRepository } from '../infrastructure-server/adapters/prisma/resource-bookmark-prisma.repository';
import { RepositoryRepositoryFactory } from '../infrastructure-server/di/repository-repository.factory';
import { FsStorageAdapter } from '../infrastructure-server/adapters/fs/fs-storage.adapter';
import {
  registerRepositoryRoutes,
  registerResourceRoutes,
  registerFolderRoutes,
} from './routes/index';
import { createRepositoryTransportHandlers } from './transport-handlers';
import { createRepositoryRuntimeContribution } from './runtime';

// ---------------------------------------------------------------------------
// Module context — 模块注册上下文
// ---------------------------------------------------------------------------

/**
 * Module registration context (structurally compatible with IApiModuleContext).
 * 模块注册上下文（与 apps/api 的 IApiModuleContext 结构兼容）。
 *
 * Defined locally to avoid circular dependency on apps/api.
 * 在包内本地定义，避免对 apps/api 的循环依赖。
 */
export interface RepositoryApiModuleContext {
  readonly app: import('express').Express;
  readonly router: Router;
  readonly db: unknown;
  readonly middleware: {
    readonly auth: import('express').RequestHandler;
    requireRole(roles: string[]): import('express').RequestHandler;
  };
  readonly openApiRegistry?: import('@dailyuse/utils/result').OpenApiRegistryLike;
}

export interface RepositoryApiModuleDef {
  readonly name: string;
  register(context: RepositoryApiModuleContext): Promise<void> | void;
  destroy?(): Promise<void> | void;
}

// ---------------------------------------------------------------------------
// Module singleton — 模块单例
// ---------------------------------------------------------------------------

let activeRepositoryModule: RepositoryModuleInstance | null = null;

// ---------------------------------------------------------------------------
// API Module — API 模块
// ---------------------------------------------------------------------------

export const RepositoryApiModule: RepositoryApiModuleDef = {
  name: 'Repository',

  register(context) {
    const { router, middleware, db } = context;

    // 1. Composition Root — 组装依赖（使用共享数据库单例）
    const prismaClient = db as PrismaClient;
    const repositories = RepositoryRepositoryFactory.createPrismaRepositories(prismaClient);
    const storageBaseDir =
      process.env.REPOSITORY_STORAGE_PATH || '/tmp/dailyuse-repository-storage';

    const repositoryModule = createRepositoryModule({
      // The application edge decides which adapter implementation to use.
      // 模块内部只关心端口，不关心数据源来自 Prisma 还是其他实现。
      repositoryRepository: repositories.repositoryRepository,
      resourceRepository: repositories.resourceRepository,
      folderRepository: repositories.folderRepository,
      resourceBookmarkRepository: new ResourceBookmarkPrismaRepository(prismaClient),
      storagePort: new FsStorageAdapter(storageBaseDir),
      runtimeContributions: createRepositoryRuntimeContribution(),
    });
    activeRepositoryModule = repositoryModule;
    repositoryModule.start();

    // 2. Transport handler wiring — 传输层处理器接线（thin mapping）
    const handlers = createRepositoryTransportHandlers(repositoryModule.api);

    // 3. Route mounting — 路由挂载
    const repositoryRoutes = registerRepositoryRoutes(
      handlers,
      middleware,
      context.openApiRegistry,
    );
    const resourceRoutes = registerResourceRoutes(handlers, middleware, context.openApiRegistry);
    const folderRoutes = registerFolderRoutes(handlers, middleware, context.openApiRegistry);

    router.use('/repositories', repositoryRoutes);
    router.use('/resources', resourceRoutes);
    router.use('/folders', folderRoutes);
  },

  destroy() {
    activeRepositoryModule?.dispose();
    activeRepositoryModule = null;
  },
};
