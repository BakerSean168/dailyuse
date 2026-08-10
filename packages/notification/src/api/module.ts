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

import type { PrismaClient } from '@memoflow/database';
import type { ServerModuleContext } from '@memoflow/contracts/shared';
import {
  createNotificationPrismaModule,
  type NotificationModuleInstance,
} from '../server/infrastructure';
import { registerNotificationRoutes } from './routes';

/**
 * Typed module context for notification registration.
 * Extends the shared ServerModuleContext with PrismaClient as the db type.
 *
 * Transport/config injection (P0-3): the API composition root may supply real
 * Desktop/Push transports through these optional fields. When a transport is
 * provided, the corresponding channel capability is available; when omitted,
 * `createNotificationPrismaModule` composes fail-closed deliverers whose
 * `isAvailable()` is false, so production startup fails fast instead of
 * fabricating success. There is no implicit fallback or no-op transport.
 *
 * @example
 * ```typescript
 * const context: NotificationApiModuleContext = {
 *   ...baseContext,
 *   desktopTransport: createDefaultElectronDesktopTransport(),
 *   pushTransport: createSomePushTransport(),
 * };
 * ```
 */
export type NotificationApiModuleContext = ServerModuleContext<PrismaClient> & {
  /** Real Desktop transport (e.g. Electron native Notification ack transport). Omit to stay fail-closed. */
  readonly desktopTransport?: unknown;
  /** Real Push transport (e.g. FCM/APNs adapter returning verifiable acks). Omit to stay fail-closed. */
  readonly pushTransport?: unknown;
  /** Expressed channel capabilities owned by this lane/module instance. */
  readonly channelCapabilities?: import('../server/infrastructure/runtime/notification.runtime').ChannelCapabilitySpec[];
};

export interface NotificationApiModuleOptions {
  /** Expressed channel capabilities owned by this lane/module instance. */
  readonly channelCapabilities?: import('../server/infrastructure/runtime/notification.runtime').ChannelCapabilitySpec[];
  /** Real Desktop transport. */
  readonly desktopTransport?: unknown;
  /** Real Push transport. */
  readonly pushTransport?: unknown;
}

export interface NotificationApiModuleDef {
  readonly name: string;
  register(context: NotificationApiModuleContext): void;
  destroy?(): void;
}

let activeNotificationModule: NotificationModuleInstance | null = null;

export function createNotificationApiModule(
  options: NotificationApiModuleOptions = {},
): NotificationApiModuleDef {
  return {
    name: 'Notification',

    register(context) {
      const { router, middleware, db } = context;

      // 透传 API composition 注入的 transport/config/lane capability（P0-1/P0-3）：
      // 有 transport 或显式 lane capability 声明 → 对应 channel capability available/checked；
      // 无声明且无 transport → fail-closed（production 启动对缺失 capability fail-fast）。
      const notificationModule = createNotificationPrismaModule(db, {
        desktopTransport: options.desktopTransport ?? context.desktopTransport,
        pushTransport: options.pushTransport ?? context.pushTransport,
        channelCapabilities: options.channelCapabilities ?? context.channelCapabilities,
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
}

export const NotificationApiModule: NotificationApiModuleDef = createNotificationApiModule();
