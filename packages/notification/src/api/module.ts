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
import { NotificationModule } from '../infrastructure-server';
import { NotificationContainer } from '../infrastructure-server/di/notification-container';
import { registerNotificationRoutes } from './routes';
import type { NotificationRouteHandlers } from './routes';
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
    const handlers: NotificationRouteHandlers = {
      createNotification: (data) =>
        notificationModule.notificationService.createNotification(data),
      listNotifications: (query) =>
        notificationModule.notificationService.listNotifications(query),
      getNotification: (id) =>
        notificationModule.notificationService.getNotification(id),
      updateNotification: (_id, _data) =>
        Promise.resolve(_data),
      deleteNotification: (id) =>
        notificationModule.notificationService.deleteNotification(id),
      markAsRead: (id) =>
        notificationModule.notificationService.markAsRead(id),
      batchMarkAsRead: (data) =>
        notificationModule.notificationService.markAsRead(data.notificationIds?.[0])
          .then(() => ({ success: true, affected: data.notificationIds?.length ?? 0 })),
      batchDelete: (data) =>
        Promise.all(
          (data.notificationIds ?? []).map((id: string) =>
            notificationModule.notificationService.deleteNotification(id),
          ),
        ).then(() => ({ success: true, affected: data.notificationIds?.length ?? 0 })),
      cleanupOldNotifications: (data) =>
        notificationModule.notificationService.clearAll(data.identityId)
          .then(() => ({ success: true, affected: 0 })),
    };

    // 3. Register routes (inject platform middleware)
    const notificationRoutes = registerNotificationRoutes(handlers, middleware);

    // 4. Mount to main router
    router.use('/notifications', notificationRoutes);

    // 5. Register initialization tasks (event listeners etc.)
    registerNotificationInitializationTasks();
  },

  destroy() {
    NotificationContainer.getInstance().reset();
  },
};