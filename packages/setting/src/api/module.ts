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

import type { PrismaClient } from '@dailyuse/database';
import type { ServerModuleContext } from '@dailyuse/contracts/shared';
import {
  createSettingModule,
  UserSettingPrismaRepository,
  type SettingModuleInstance,
} from '../infrastructure-server';
import { registerSettingRoutes } from './routes';
import { createSettingTransportHandlers } from './transport-handlers';
import { createSettingRuntimeContribution } from './runtime';

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

    // 1. Composition Root — 组装依赖（使用共享数据库单例）
    const settingModule = createSettingModule({
      userSettingRepository: new UserSettingPrismaRepository(db),
      runtimeContributions: createSettingRuntimeContribution(),
    });
    activeSettingModule = settingModule;
    settingModule.start();

    // 2. 创建路由处理器
    const handlers = createSettingTransportHandlers(settingModule.api);

    // 3. 注册路由
    const settingRoutes = registerSettingRoutes(handlers, middleware, context.openApiRegistry);

    // 4. 挂载到 API 路由
    router.use('/settings', settingRoutes);
  },

  destroy() {
    activeSettingModule?.dispose();
    activeSettingModule = null;
  },
};
