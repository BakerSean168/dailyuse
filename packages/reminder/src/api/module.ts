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

import type { PrismaClient } from '@dailyuse/database';
import type { ServerModuleContext } from '@dailyuse/contracts/shared';
import {
  createReminderModule,
  ReminderTemplatePrismaRepository,
  ReminderGroupPrismaRepository,
  ReminderResponsePrismaRepository,
  UserReminderPreferencePrismaRepository,
  type ReminderModuleInstance,
} from '../infrastructure-server';
import { createScheduleTaskPrismaRepository } from '@dailyuse/schedule/api';
import { registerReminderRoutes } from './routes';
import { createReminderTransportHandlers } from './transport-handlers';
import { createReminderScheduleRuntimeContribution } from './schedule-runtime';

/**
 * Typed module context for reminder registration.
 * Extends the shared ServerModuleContext with PrismaClient as the db type.
 */
export type ReminderApiModuleContext = ServerModuleContext<PrismaClient>;

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
    const prismaClient = db;
    const reminderTemplateRepository = new ReminderTemplatePrismaRepository(prismaClient);
    const reminderGroupRepository = new ReminderGroupPrismaRepository(prismaClient);
    const reminderModule = createReminderModule({
      reminderTemplateRepository,
      reminderGroupRepository,
      reminderResponseRepository: new ReminderResponsePrismaRepository(prismaClient),
      userReminderPreferenceRepository: new UserReminderPreferencePrismaRepository(prismaClient),
      runtimeContributions: createReminderScheduleRuntimeContribution({
        reminderTemplateRepository,
        scheduleTaskRepository: createScheduleTaskPrismaRepository(prismaClient),
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
