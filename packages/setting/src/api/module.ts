/**
 * Setting API Module Definition
 *
 * 实现 IApiModule 标准接口，内部自治完成：
 * 1. Composition Root（创建 Repo → UseCase → Handler）
 * 2. 路由定义与挂载
 * 3. 初始化任务注册
 *
 * 中间件来自 context.middleware，不依赖 apps/api 内部实现。
 */

import type { PrismaClient } from '@memoflow/database';
import type { ServerModuleContext } from '@memoflow/contracts/shared';
import {
  createSettingPrismaModule,
  type SettingModuleInstance,
} from '../server/infrastructure';
import { registerSettingRoutes } from './routes';
import { createSettingRuntimeContribution } from '../server/infrastructure/runtime';

/**
 * Typed module context for setting registration.
 * Extends the shared ServerModuleContext with PrismaClient as the db type.
 */
export type SettingApiModuleContext = ServerModuleContext<PrismaClient>;

export interface SettingApiModuleDef {
  readonly name: string;
  register(context: SettingApiModuleContext): void;
  destroy?(): void;
}

let activeSettingModule: SettingModuleInstance | null = null;

export const SettingApiModule: SettingApiModuleDef = {
  name: 'Setting',

  register(context) {
    const { router, middleware, db } = context;

    const settingModule = createSettingPrismaModule(db, {
      runtimeContributions: createSettingRuntimeContribution(),
    });
    activeSettingModule = settingModule;
    settingModule.start();

    const settingRoutes = registerSettingRoutes(
      settingModule.api,
      middleware,
      context.openApiRegistry,
    );

    router.use('/settings', settingRoutes);
  },

  destroy() {
    activeSettingModule?.dispose();
    activeSettingModule = null;
  },
};
