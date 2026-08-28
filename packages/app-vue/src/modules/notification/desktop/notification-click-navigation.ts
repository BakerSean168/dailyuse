/**
 * Desktop 通知点击导航（R3 收尾）。
 *
 * 桌面 main 弹系统通知时 payload 携带 notificationId/type/category；
 * 点击后 main 经 `notification:clicked` 推回 renderer。这里把点击转成稳定导航：
 *
 * 1. payload 携带 navigationIntent（{ route, params }）→ 直接 router.push；
 * 2. 否则按 category 映射模块默认 route；
 * 3. 未知 → /notifications。
 *
 * 只消费稳定意图，不解析任意业务 payload（R3d 契约）。
 */

import type { Router } from 'vue-router';
import { RendererEventChannels } from '@memoflow/contracts/electron';
import type { ElectronBridge } from '../../../di/keys';
import type { NotificationNavigationIntentDTO } from '@memoflow/contracts/notification';
import { createLogger } from '@memoflow/utils/logger';

const logger = createLogger('notification:click-nav');

/** category → 模块默认 route（稳定 landing，不依赖 history）。 */
const CATEGORY_ROUTE: Record<string, string> = {
  Task: '/tasks',
  Goal: '/goals',
  Schedule: '/schedule',
  Reminder: '/reminders',
  Account: '/notifications',
  System: '/notifications',
  task: '/tasks', goal: '/goals', schedule: '/schedule', reminder: '/reminders',
  account: '/notifications', system: '/notifications', other: '/notifications',
};

interface ClickedPayload {
  notificationId?: string;
  notificationType?: string;
  notificationCategory?: string;
  category?: string;
  navigationIntent?: NotificationNavigationIntentDTO | null;
  route?: string;
  params?: Record<string, string>;
}

function isNavigationIntent(value: unknown): value is NotificationNavigationIntentDTO {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as NotificationNavigationIntentDTO).route === 'string'
  );
}

export function resolveNotificationDestination(
  payload: Pick<ClickedPayload, 'navigationIntent' | 'notificationCategory' | 'category'>,
): { path: string; query?: Record<string, string> } {
  if (payload.navigationIntent && isNavigationIntent(payload.navigationIntent)) {
    return { path: payload.navigationIntent.route, query: payload.navigationIntent.params };
  }
  const category = payload.notificationCategory ?? payload.category;
  return { path: CATEGORY_ROUTE[category ?? ''] ?? '/notifications' };
}

export function createNotificationClickNavigation(
  router: Router,
  getBridge: () => ElectronBridge | undefined,
): { start(): void; stop(): void } {
  let started = false;

  const handleClick = (...args: unknown[]): void => {
    const payload = (args[0] ?? {}) as ClickedPayload;
    const destination = resolveNotificationDestination(payload);
    logger.info('[Notification] Click navigation', {
      notificationId: payload.notificationId,
      route: destination,
    });
    void router.push(destination).catch((error) => {
      // Internal developer surface: the raw navigation failure stays in the log
      // via String() coercion (never assigned to user-visible state).
      logger.error('[Notification] Click navigation failed', {
        route: destination,
        error: String(error),
      });
    });
  };

  return {
    start() {
      if (started) return;
      started = true;
      const bridge = getBridge();
      if (!bridge) {
        logger.warn('[Notification] No desktop bridge; click navigation disabled');
        return;
      }
      bridge.on(RendererEventChannels.NOTIFICATION_CLICKED, handleClick);
      logger.info('[Notification] Click navigation started');
    },

    stop() {
      if (!started) return;
      started = false;
      getBridge()?.off(RendererEventChannels.NOTIFICATION_CLICKED, handleClick);
    },
  };
}
