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
  RulePrismaRepository,
  RuleRevisionPrismaRepository,
  GovernanceModule,
} from '../infrastructure-server';
import { GovernanceContainer } from '../infrastructure-server/di/governance-container';
import { registerGovernanceCrudRoutes } from './routes';
import type { GovernanceUseCases } from '../controllers/governance.controller';
import { registerGovernanceInitializationTasks } from './initialization';

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

export interface GovernanceApiModuleOptions {
  /** 自定义路由前缀（默认 '/governance/rules'） */
  routePrefix?: string;
  /** 是否同时挂载短路径 '/rules'（默认 true） */
  enableShortPath?: boolean;
}

export interface GovernanceApiModuleDef {
  readonly name: string;
  register(context: GovernanceApiModuleContext): void;
  destroy?(): void;
}

export const GovernanceApiModule: GovernanceApiModuleDef = {
  name: 'Governance',

  register(context) {
    const { router, middleware, db } = context;

    // 1. Composition Root — 组装依赖（使用共享数据库单例）
    const prismaClient = db as PrismaClient;
    const ruleRepository = new RulePrismaRepository(prismaClient);
    const revisionRepository = new RuleRevisionPrismaRepository(prismaClient);
    const governanceModule = new GovernanceModule({
      ruleRepository,
      revisionRepository,
    });

    const handlers: GovernanceUseCases = {
      createRule: (req, cx) => governanceModule.createRule.execute(req, cx),
      updateRule: (id, req, cx) => governanceModule.updateRule.execute(id, req, cx),
      deleteRule: (req, cx) => governanceModule.deleteRule.execute(req, cx),
      getRule: (req) => governanceModule.getRule.execute(req),
      listRules: (query) => governanceModule.listRules.execute(query),
      searchRules: (req, cx) => governanceModule.searchRules.execute(req, cx),
      getRevisions: (query) => governanceModule.getRevisions.execute(query),
    };

    // 2. 创建路由（注入平台中间件）
    const governanceRoutes = registerGovernanceCrudRoutes(
      handlers,
      middleware,
      context.openApiRegistry,
    );

    // 3. 挂载到主路由（模块自决前缀）
    router.use('/governance/rules', governanceRoutes);
    router.use('/rules', governanceRoutes);

    // 4. 注册初始化任务（事件处理器等）
    registerGovernanceInitializationTasks();
  },

  destroy() {
    GovernanceContainer.getInstance().reset();
  },
};
