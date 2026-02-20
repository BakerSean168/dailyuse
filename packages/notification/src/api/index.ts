/**
 * Notification API Module
 *
 * Self-contained API module entry — exposed to ApiBootstrapper via register():
 * - Internally completes Composition Root assembly
 * - Uses platform-level middleware via context.middleware (auth, rbac)
 * - Mounts routes via context.router
 *
 * Route prefix: /notifications
 */

export { NotificationApiModule } from './module';
export type { NotificationApiModuleContext, NotificationApiModuleDef } from './module';
export { registerNotificationInitializationTasks } from './initialization';
export { NotificationController, type NotificationUseCases } from '../controllers';