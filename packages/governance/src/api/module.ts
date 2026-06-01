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

import type { PrismaClient } from '@dailyuse/database';
import type { ServerModuleContext } from '@dailyuse/contracts/shared';
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
 * Typed module context for governance registration.
 * Extends the shared ServerModuleContext with PrismaClient as the db type.
 */
export type GovernanceApiModuleContext = ServerModuleContext<PrismaClient>;

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

    // 1. Composition Root — 组装依赖
    const governanceModule = createGovernanceModule({
      // The application edge decides which adapter implementation to use.
      // 模块内部只关心端口，不关心数据源来自 Prisma 还是其他实现。
      ruleRepository: new RulePrismaRepository(db),
      revisionRepository: new RuleRevisionPrismaRepository(db),
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
