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
  createNotificationModule,
  NotificationPrismaRepository,
  NotificationPreferencePrismaRepository,
  NotificationTemplatePrismaRepository,
  type NotificationModuleInstance,
} from '../infrastructure-server';
import { registerNotificationRoutes } from './routes';
import { createNotificationTransportHandlers } from './transport-handlers';
import { createNotificationRuntimeContribution } from './runtime';

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

    // 1. Composition Root — 组装依赖（使用共享数据库单例）
    // The application edge decides which adapter implementation to use.
    // 模块内部只关心端口，不关心数据源来自 Prisma 还是其他实现。
    const prismaClient = db;
    const notificationModule = createNotificationModule({
      notificationRepository: new NotificationPrismaRepository(prismaClient),
      preferenceRepository: new NotificationPreferencePrismaRepository(prismaClient),
      templateRepository: new NotificationTemplatePrismaRepository(prismaClient),
      runtimeContributions: createNotificationRuntimeContribution(),
    });
    activeNotificationModule = notificationModule;
    notificationModule.start();

    // 2. Transport handlers — convert module facade to controller signatures.
    // 传输处理器 — 将模块门面转换为控制器签名。
    const handlers = createNotificationTransportHandlers(notificationModule.api);

    // 3. 创建路由（注入平台中间件）
    const notificationRoutes = registerNotificationRoutes(
      handlers,
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
