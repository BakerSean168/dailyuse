/**
 * Notification API Module Definition
 * 通知 API 模块定义
 *
 * 实现 IApiModule 标准接口，内部自治完成：
 * 1. Composition Root（创建 Repo → UseCase → Handler）
 * 2. 路由定义与挂载
 * 3. 初始化任务注册（通过 runtime contribution）
 *
 * 中间件来自 context.middleware，不依赖 apps/api 内部实现。
 */

import type { PrismaClient } from '@dailyuse/database';
import type { ServerModuleContext } from '@dailyuse/contracts/shared';
import {
  createNotificationPrismaModule,
  createNotificationRuntimeContribution,
  type NotificationModuleInstance,
} from '../server/infrastructure';
import { registerNotificationRoutes } from './routes';

/**
 * Typed module context for notification registration.
 * Extends the shared ServerModuleContext with PrismaClient as the db type.
 */
export type NotificationApiModuleContext = ServerModuleContext<PrismaClient>;

export interface NotificationApiModuleDef {
  readonly name: string;
  register(context: NotificationApiModuleContext): void;
  destroy?(): void;
}

let activeNotificationModule: NotificationModuleInstance | null = null;

export const NotificationApiModule: NotificationApiModuleDef = {
  name: 'Notification',

  register(context) {
    const { router, middleware, db } = context;

    const notificationModule = createNotificationPrismaModule(db, {
      runtimeContributions: createNotificationRuntimeContribution(),
    });
    activeNotificationModule = notificationModule;
    notificationModule.start();

    const notificationRoutes = registerNotificationRoutes(
      notificationModule.api,
      middleware,
      context.openApiRegistry,
    );

    // 4. 挂载到主路由（模块自决前缀）
    router.use('/notifications', notificationRoutes);
  },

  destroy() {
    activeNotificationModule?.dispose();
    activeNotificationModule = null;
  },
};
