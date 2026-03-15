/**
 * Reminder API Module Definition.
 * 提醒 API 模块定义。
 *
 * Implements the standard 3-step module pattern:
 * 实现标准的三步模块模式：
 * 1. Composition Root (createReminderModule → Repositories → ApplicationPort)
 *    组合根（创建模块 → 仓储 → 应用端口）
 * 2. Transport handler mapping (ApplicationPort → Controller)
 *    传输层处理器映射（应用端口 → 控制器）
 * 3. Route definition and mounting
 *    路由定义与挂载
 *
 * Middleware comes from context.middleware, no dependency on apps/api internals.
 * 中间件来自 context.middleware，不依赖 apps/api 内部实现。
 */

import { Router } from 'express';
import type { PrismaClient } from '@dailyuse/database';
import {
  createReminderModule,
  ReminderTemplatePrismaRepository,
  ReminderGroupPrismaRepository,
  ReminderResponsePrismaRepository,
  UserReminderPreferencePrismaRepository,
  type ReminderModuleInstance,
} from '../infrastructure-server';
import { registerReminderRoutes } from './routes';
import { createReminderTransportHandlers } from './transport-handlers';
import { createReminderTriggerCronJob } from '../infrastructure-server/cron/reminder-trigger-cron-job';

/**
 * Module registration context (structurally compatible with apps/api's IApiModuleContext).
 * 模块注册上下文（与 apps/api 的 IApiModuleContext 结构兼容）。
 */
export interface ReminderApiModuleContext {
  readonly app: import('express').Express;
  readonly router: Router;
  readonly db: unknown;
  readonly middleware: {
    readonly auth: import('express').RequestHandler;
    requireRole(roles: string[]): import('express').RequestHandler;
  };
  readonly openApiRegistry?: import('@dailyuse/utils/result').OpenApiRegistryLike;
}

export interface ReminderApiModuleDef {
  readonly name: string;
  register(context: ReminderApiModuleContext): Promise<void> | void;
  destroy?(): Promise<void> | void;
}

let activeReminderModule: ReminderModuleInstance | null = null;

export const ReminderApiModule: ReminderApiModuleDef = {
  name: 'Reminder',

  register(context) {
    const { router, middleware, db } = context;

    // 1. Composition Root — assemble dependencies (using shared database singleton)
    //    组合根 — 组装依赖（使用共享数据库单例）
    const prismaClient = db as PrismaClient;
    const reminderTemplateRepository = new ReminderTemplatePrismaRepository(prismaClient);
    const reminderGroupRepository = new ReminderGroupPrismaRepository(prismaClient);
    const reminderModule = createReminderModule({
      reminderTemplateRepository,
      reminderGroupRepository,
      reminderResponseRepository: new ReminderResponsePrismaRepository(prismaClient),
      userReminderPreferenceRepository: new UserReminderPreferencePrismaRepository(prismaClient),
      runtimeContributions: createReminderTriggerCronJob({
        reminderTemplateRepository,
        reminderGroupRepository,
      }),
    });
    activeReminderModule = reminderModule;
    reminderModule.start();

    // 2. Transport handler mapping (ApplicationPort → ReminderUseCases)
    //    传输层处理器映射（应用端口 → 用例接口）
    const handlers = createReminderTransportHandlers(reminderModule.api);

    // 3. Create and mount routes (inject platform middleware)
    //    创建并挂载路由（注入平台中间件）
    const reminderRoutes = registerReminderRoutes(handlers, middleware, context.openApiRegistry);
    router.use('/reminders', reminderRoutes);
  },

  destroy() {
    activeReminderModule?.dispose();
    activeReminderModule = null;
  },
};
