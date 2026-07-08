/**
 * Reminder API Module Definition.
 * 提醒 API 模块定义。
 *
 * Implements the standard module pattern:
 * 实现标准模块模式：
 * 1. Composition Root (createReminderModule → Repositories → ApplicationPort)
 *    组合根（创建模块 → 仓储 → 应用端口）
 * 2. Route definition and mounting
 *    路由定义与挂载
 *
 * Middleware comes from context.middleware, no dependency on apps/api internals.
 * 中间件来自 context.middleware，不依赖 apps/api 内部实现。
 */

import type { PrismaClient } from '@dailyuse/database';
import type { ServerModuleContext } from '@dailyuse/contracts/shared';
import {
  createReminderPrismaModule,
  createReminderRuntimeContribution,
  type ReminderModuleInstance,
} from '../server/infrastructure';
import { registerReminderRoutes } from './routes';

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

    const reminderModule = createReminderPrismaModule(db, {
      runtimeContributions: createReminderRuntimeContribution(),
    });
    activeReminderModule = reminderModule;
    reminderModule.start();

    // 2. Create and mount routes (inject platform middleware)
    //    创建并挂载路由（注入平台中间件）
    const reminderRoutes = registerReminderRoutes(
      reminderModule.api,
      middleware,
      context.openApiRegistry,
    );
    router.use('/reminders', reminderRoutes);
  },

  destroy() {
    activeReminderModule?.dispose();
    activeReminderModule = null;
  },
};
