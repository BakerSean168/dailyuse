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

import type { PrismaClient } from '@memoflow/database';
import type { ServerModuleContext } from '@memoflow/contracts/shared';
import {
  createReminderPrismaModule,
  createReminderPrismaRepositories,
  createReminderRuntimeContribution,
  type ReminderModuleInstance,
} from '../server/infrastructure';
import { createReminderTriggerCronJob } from '../server/infrastructure/cron/reminder-trigger-cron-job';
import { registerReminderRoutes } from './routes';

/**
 * Typed module context for reminder registration.
 * Extends the shared ServerModuleContext with PrismaClient as the db type.
 */
export type ReminderApiModuleContext = ServerModuleContext<PrismaClient>;

export interface ReminderApiModuleOptions {
  /** Required: production fail-closed guard for new-work entrypoints. */
  readonly closureChecker: (identityId: string) => Promise<boolean>;
}

export interface ReminderApiModuleDef {
  readonly name: string;
  register(context: ReminderApiModuleContext): Promise<void> | void;
  destroy?(): Promise<void> | void;
}

let activeReminderModule: ReminderModuleInstance | null = null;

export function createReminderApiModule(
  options: ReminderApiModuleOptions,
): ReminderApiModuleDef {
  return {
    name: 'Reminder',

    register(context) {
      const { router, middleware, db } = context;

      const repositories = createReminderPrismaRepositories(db);
      const cronJob = createReminderTriggerCronJob({
        reminderTemplateRepository: repositories.reminderTemplateRepository,
        reminderGroupRepository: repositories.reminderGroupRepository,
        reliablePort: repositories.reliablePort,
        transactionRunner: repositories.transactionRunner,
      });

      const runtimeContribution = createReminderRuntimeContribution({
        cronContribution: cronJob,
      });

      if (!options.closureChecker) {
        throw new Error('[FAIL-CLOSED] createReminderApiModule requires closureChecker');
      }
      const closureChecker = options.closureChecker;

      const reminderModule = createReminderPrismaModule(db, {
        closureChecker,
        runtimeContributions: runtimeContribution,
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

    async destroy() {
      if (activeReminderModule) {
        await activeReminderModule.dispose();
        activeReminderModule = null;
      }
    },
  };
}

