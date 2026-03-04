/**
 * Notification API Module Definition
 *
 * Implements IApiModule standard interface:
 * 1. Composition Root (NotificationModule → Services → Handlers)
 * 2. Route definition and mounting
 * 3. Initialization task registration
 *
 * Middleware comes from context.middleware, no dependency on apps/api internals.
 */

import { Router } from 'express';
import type { Express, RequestHandler } from 'express';
import type { PrismaClient } from '@dailyuse/database';
import { ok } from '@dailyuse/contracts/result';
import { NotificationModule } from '../infrastructure-server';
import { NotificationContainer } from '../infrastructure-server/di/notification-container';
import { registerNotificationRoutes } from './routes';
import type { NotificationUseCases } from '../controllers/notification.controller';
import { registerNotificationInitializationTasks } from './initialization';

/**
 * Module registration context (structurally compatible with IApiModuleContext from apps/api).
 * Locally defined to avoid circular dependency on apps/api.
 */
export interface NotificationApiModuleContext {
  readonly app: Express;
  readonly router: Router;
  readonly db: unknown;
  readonly middleware: {
    readonly auth: RequestHandler;
    requireRole(roles: string[]): RequestHandler;
  };
  readonly openApiRegistry?: import('@dailyuse/utils/result').OpenApiRegistryLike;
}

export interface NotificationApiModuleDef {
  readonly name: string;
  register(context: NotificationApiModuleContext): Promise<void> | void;
  destroy?(): Promise<void> | void;
}

export const NotificationApiModule: NotificationApiModuleDef = {
  name: 'Notification',

  register(context) {
    const { router, middleware, db } = context;

    // 1. Composition Root — assemble dependencies using shared database singleton
    const prismaClient = db as PrismaClient;
    const notificationModule = new NotificationModule('prisma', prismaClient);

    // 2. Create route handlers delegating to application services
    const handlers: NotificationUseCases = {
      createNotification: async (data) =>
        ok(await notificationModule.notificationService.createNotification(data)),
      listNotifications: async (query) =>
        ok(await notificationModule.notificationService.listNotifications(query)),
      getNotification: async (id) =>
        ok(await notificationModule.notificationService.getNotification(id)),
      updateNotification: async (_id, _data) => ok(_data),
      deleteNotification: async (id) => {
        await notificationModule.notificationService.deleteNotification(id);
        return ok(undefined);
      },
      markAsRead: async (id) => ok(await notificationModule.notificationService.markAsRead(id)),
      markAllAsRead: async (identityId) => {
        await notificationModule.notificationService.markAllAsRead(identityId);
        return ok({ count: 0 });
      },
      getUnreadCount: async (identityId) => {
        const count = await notificationModule.notificationService.getUnreadCount(identityId);
        return ok({ count });
      },
      batchMarkAsRead: async (data) => {
        await notificationModule.notificationService.markAsRead(data.notificationIds?.[0]);
        return ok({ success: true, affected: data.notificationIds?.length ?? 0 });
      },
      batchDelete: async (data) => {
        await Promise.all(
          (data.notificationIds ?? []).map((id: string) =>
            notificationModule.notificationService.deleteNotification(id),
          ),
        );
        return ok({ success: true, affected: data.notificationIds?.length ?? 0 });
      },
      cleanupOldNotifications: async (data) => {
        await notificationModule.notificationService.clearAll(data.identityId);
        return ok({ success: true, affected: 0 });
      },
    };

    // 3. Register routes (inject platform middleware)
    const notificationRoutes = registerNotificationRoutes(
      handlers,
      middleware,
      context.openApiRegistry,
    );

    // 4. Mount to main router
    router.use('/notifications', notificationRoutes);

    // 5. Register initialization tasks (event listeners etc.)
    registerNotificationInitializationTasks();
  },

  destroy() {
    NotificationContainer.getInstance().reset();
  },
};
