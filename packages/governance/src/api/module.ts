/**
 * Governance API Module Definition
 *
 * 实现 IApiModule 标准接口，内部自治完成：
 * 1. Composition Root（创建 Repo → UseCase → Handler）
 * 2. 路由定义与挂载
 * 3. 初始化任务注册
 *
 * 中间件来自 context.middleware，不依赖 apps/api 内部实现。
 */

import { Router } from 'express';
import type { PrismaClient } from '@dailyuse/database';
import {
  createGovernanceModule,
  RulePrismaRepository,
  RuleRevisionPrismaRepository,
  type GovernanceModuleInstance,
} from '../infrastructure-server';
import { registerGovernanceRoutes } from './routes';
import { createGovernanceTransportHandlers } from './transport-handlers';
import { createGovernanceRuntimeContribution } from './runtime';

/**
 * 模块注册上下文（与 apps/api 的 IApiModuleContext 对齐）
 *
 * 此类型在 governance 包内本地定义，避免对 apps/api 的循环依赖。
 * 只要字段签名一致，TypeScript 结构类型系统会自动兼容。
 */
export interface GovernanceApiModuleContext {
  readonly app: import('express').Express;
  readonly router: Router;
  readonly db: unknown;
  readonly middleware: {
    readonly auth: import('express').RequestHandler;
    requireRole(roles: string[]): import('express').RequestHandler;
  };
  readonly openApiRegistry?: import('@dailyuse/utils/result').OpenApiRegistryLike;
}

export interface GovernanceApiModuleDef {
  readonly name: string;
  register(context: GovernanceApiModuleContext): void;
  destroy?(): void;
}

let activeGovernanceModule: GovernanceModuleInstance | null = null;

export const GovernanceApiModule: GovernanceApiModuleDef = {
  name: 'Governance',

  register(context) {
    const { router, middleware, db } = context;

    // 1. Composition Root — 组装依赖（使用共享数据库单例）
    const prismaClient = db as PrismaClient;
    const governanceModule = createGovernanceModule({
      // The application edge decides which adapter implementation to use.
      // 模块内部只关心端口，不关心数据源来自 Prisma 还是其他实现。
      ruleRepository: new RulePrismaRepository(prismaClient),
      revisionRepository: new RuleRevisionPrismaRepository(prismaClient),
      runtimeContributions: createGovernanceRuntimeContribution(),
    });
    activeGovernanceModule = governanceModule;
    governanceModule.start();

    const handlers = createGovernanceTransportHandlers(governanceModule.api);

    // 2. 创建路由（注入平台中间件）
    const governanceRoutes = registerGovernanceRoutes(
      handlers,
      middleware,
      context.openApiRegistry,
    );

    // 3. 挂载到主路由（模块自决前缀）
    router.use('/governance/rules', governanceRoutes);
    router.use('/rules', governanceRoutes);
  },

  destroy() {
    activeGovernanceModule?.dispose();
    activeGovernanceModule = null;
  },
};
