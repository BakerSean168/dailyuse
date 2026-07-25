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
import type { RepositoryApplicationPort } from '../server/application';
import type { IKnowledgeRepositoryCloudDataPurger } from '../server/application';
import { registerRepositoryRoutes } from './routes/index';

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
  /** The composed application surface for sibling modules in the same host. */
  readonly getApplicationPort: () => RepositoryApplicationPort | null;
  register(context: RepositoryApiModuleContext): Promise<void> | void;
  destroy?(): Promise<void> | void;
}

export interface CreateRepositoryApiModuleOptions {
  readonly storageBaseDir?: string;
  readonly githubApp?: {
    readonly appId: string;
    readonly appSlug: string;
    readonly privateKey: string;
    readonly webhookSecret: string;
  };
  readonly knowledgeRepositoryCloudDataPurger?: IKnowledgeRepositoryCloudDataPurger;
}

// ---------------------------------------------------------------------------
// Module singleton — 模块单例
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// API Module — API 模块
// ---------------------------------------------------------------------------

export function createRepositoryApiModule(
  options: CreateRepositoryApiModuleOptions = {},
): RepositoryApiModuleDef {
  let repositoryModule: RepositoryModuleInstance | null = null;

  return {
    name: 'Repository',
    getApplicationPort: () => repositoryModule?.api ?? null,

    register(context) {
      const { router, middleware, db } = context;

      const prismaClient = db;
      const storageBaseDir = resolveRepositoryStorageBaseDir({
        storageBaseDir: options.storageBaseDir,
      });
      repositoryModule = createRepositoryPrismaModule(prismaClient, {
        storageBaseDir,
        githubApp: options.githubApp,
        knowledgeRepositoryCloudDataPurger: options.knowledgeRepositoryCloudDataPurger,
        runtimeContributions: createRepositoryRuntimeContribution(),
      });
      repositoryModule.start();

      const repositoryRoutes = registerRepositoryRoutes(
        repositoryModule.api,
        middleware,
        context.openApiRegistry,
      );
      router.use('/repositories', repositoryRoutes);
    },

    destroy() {
      repositoryModule?.dispose();
      repositoryModule = null;
    },
  };
}

export const RepositoryApiModule: RepositoryApiModuleDef = createRepositoryApiModule();
