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

import { Router } from 'express';
import type { PrismaClient } from '@dailyuse/database';
import { SettingModule } from '../infrastructure-server';
import { SettingContainer } from '../infrastructure-server/di/setting-container';
import { registerSettingRoutes } from './routes';
import type { SettingRouteHandlers } from './routes';
import { registerSettingInitializationTasks } from './initialization';

export interface SettingApiModuleContext {
  readonly app: import('express').Express;
  readonly router: Router;
  readonly db: unknown;
  readonly middleware: {
    readonly auth: import('express').RequestHandler;
    requireRole(roles: string[]): import('express').RequestHandler;
  };
}

export interface SettingApiModuleDef {
  readonly name: string;
  register(context: SettingApiModuleContext): void;
  destroy?(): void;
}

export const SettingApiModule: SettingApiModuleDef = {
  name: 'Setting',

  register(context) {
    const { router, middleware, db } = context;

    // 1. Composition Root — 组装依赖（使用共享数据库单例）
    const settingModule = new SettingModule('prisma', db as PrismaClient);

    // 2. 创建路由处理器
    const handlers: SettingRouteHandlers = {
      getUserSetting: (identityId) =>
        settingModule.getUserSetting.execute(identityId),
      updateUserSetting: (identityId, data) =>
        settingModule.updateUserSetting.execute(identityId, data),
      resetUserSetting: (identityId) =>
        settingModule.resetUserSetting.execute(identityId),
      exportSettings: (identityId) =>
        settingModule.exportSettings.execute(identityId),
      importSettings: (identityId, data, options) =>
        settingModule.importSettings.execute(identityId, data, options),
      getDefaultSettings: () =>
        settingModule.getDefaultSettings.execute(),
    };

    // 3. 注册路由
    const settingRoutes = registerSettingRoutes(handlers, middleware);

    // 4. 挂载到 API 路由
    router.use('/settings', settingRoutes);

    // 5. 注册初始化任务
    registerSettingInitializationTasks();
  },

  destroy() {
    SettingContainer.getInstance().reset();
  },
};