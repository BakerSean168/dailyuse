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
import { ok, fail } from '@dailyuse/contracts/result';
import { SettingModule } from '../infrastructure-server';
import { SettingContainer } from '../infrastructure-server/di/setting-container';
import { registerSettingRoutes } from './routes';
import type { SettingUseCases } from '../controllers/setting.controller';
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
    const handlers: SettingUseCases = {
      getUserSetting: async (ctx) =>
        ok(await settingModule.getUserSetting.execute(ctx.identityId)),
      updateUserSetting: async (data, ctx) =>
        ok(await settingModule.updateUserSetting.execute(ctx.identityId, data)),
      resetUserSetting: async (ctx) =>
        ok(await settingModule.resetUserSetting.execute(ctx.identityId)),
      exportSettings: async (ctx) =>
        ok(await settingModule.exportSettings.execute(ctx.identityId)),
      importSettings: async (data, ctx) => {
        let importData: Record<string, any>;
        try {
          importData = JSON.parse(data.data) as Record<string, any>;
        } catch {
          return fail({ code: 'VALIDATION_ERROR' as const, message: 'Invalid JSON in data field' });
        }
        const result = await settingModule.importSettings.execute(
          ctx.identityId,
          importData,
          { merge: !data.overwrite },
        );
        return ok(result);
      },
      getDefaultSettings: () =>
        ok(settingModule.getDefaultSettings.execute()),
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