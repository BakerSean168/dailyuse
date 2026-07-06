/**
 * Governance API Module Definition
 *
 * 实现 IApiModule 标准接口，内部自治完成：
 * 1. Composition Root（创建 Repo → UseCase → API）
 * 2. 路由定义与挂载
 * 3. 模块自有 runtime 生命周期托管
 *
 * 中间件来自 context.middleware，不依赖 apps/api 内部实现。
 */

import type { PrismaClient } from '@dailyuse/database';
import type { ServerModuleContext } from '@dailyuse/contracts/shared';
import {
  createGovernancePrismaModule,
  type GovernanceModuleInstance,
} from '../server/infrastructure';
import { registerGovernanceRoutes } from './routes';

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

    const governanceModule = createGovernancePrismaModule(db);
    activeGovernanceModule = governanceModule;
    governanceModule.start();

    const governanceRoutes = registerGovernanceRoutes(
      governanceModule.api,
      middleware,
      context.openApiRegistry,
    );

    router.use('/governance/rules', governanceRoutes);
  },

  destroy() {
    activeGovernanceModule?.dispose();
    activeGovernanceModule = null;
  },
};