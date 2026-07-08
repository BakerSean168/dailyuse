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

import type { PrismaClient } from '@dailyuse/database';
import type { ServerModuleContext } from '@dailyuse/contracts/shared';
import {
  createRepositoryPrismaModule,
  resolveRepositoryStorageBaseDir,
  type RepositoryModuleInstance,
} from '../server/infrastructure';
import { createRepositoryRuntimeContribution } from '../server/infrastructure/runtime';
import {
  registerRepositoryRoutes,
  registerResourceRoutes,
  registerFolderRoutes,
} from './routes/index';

// ---------------------------------------------------------------------------
// Module context — 模块注册上下文
// ---------------------------------------------------------------------------

/**
 * Typed module context for repository registration.
 * Extends the shared ServerModuleContext with PrismaClient as the db type.
 */
export type RepositoryApiModuleContext = ServerModuleContext<PrismaClient>;

export interface RepositoryApiModuleDef {
  readonly name: string;
  register(context: RepositoryApiModuleContext): Promise<void> | void;
  destroy?(): Promise<void> | void;
}

export interface CreateRepositoryApiModuleOptions {
  readonly storageBaseDir?: string;
}

// ---------------------------------------------------------------------------
// Module singleton — 模块单例
// ---------------------------------------------------------------------------

let activeRepositoryModule: RepositoryModuleInstance | null = null;

// ---------------------------------------------------------------------------
// API Module — API 模块
// ---------------------------------------------------------------------------

export function createRepositoryApiModule(
  options: CreateRepositoryApiModuleOptions = {},
): RepositoryApiModuleDef {
  return {
    name: 'Repository',

    register(context) {
      const { router, middleware, db } = context;

      const prismaClient = db;
      const storageBaseDir = resolveRepositoryStorageBaseDir({
        storageBaseDir: options.storageBaseDir,
      });
      const repositoryModule = createRepositoryPrismaModule(prismaClient, {
        storageBaseDir,
        runtimeContributions: createRepositoryRuntimeContribution(),
      });
      activeRepositoryModule = repositoryModule;
      repositoryModule.start();

      const repositoryRoutes = registerRepositoryRoutes(
        repositoryModule.api,
        middleware,
        context.openApiRegistry,
      );
      const resourceRoutes = registerResourceRoutes(
        repositoryModule.api,
        middleware,
        context.openApiRegistry,
      );
      const folderRoutes = registerFolderRoutes(
        repositoryModule.api,
        middleware,
        context.openApiRegistry,
      );

      router.use('/repositories', repositoryRoutes);
      router.use('/resources', resourceRoutes);
      router.use('/folders', folderRoutes);
    },

    destroy() {
      activeRepositoryModule?.dispose();
      activeRepositoryModule = null;
    },
  };
}

export const RepositoryApiModule: RepositoryApiModuleDef = createRepositoryApiModule();
