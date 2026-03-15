/**
 * Notification transport handler mapping.
 * 通知传输层处理器映射。
 *
 * This file converts the module facade into the function signatures required by
 * controllers. It is shared by HTTP and Electron transports so the mapping is
 * defined once.
 *
 * 这个文件把模块门面转换成控制器所需的函数签名。
 * HTTP 和 Electron 共用这一层，避免重复定义同样的 handler 映射。
 */

import type { NotificationUseCases } from '../controllers/notification.controller';
import type { NotificationApplicationPort } from '../infrastructure-server';

/**
 * Creates controller-compatible use case handlers from the module application port.
 * 从模块应用端口创建与控制器兼容的用例处理器。
 *
 * This is intentionally thin — for notification, the port shape already matches
 * the controller's NotificationUseCases interface.
 * 这层故意很薄 — 对于通知模块，端口形状已经匹配控制器的 NotificationUseCases 接口。
 */
export function createNotificationTransportHandlers(
  api: NotificationApplicationPort,
): NotificationUseCases {
  return {
    createNotification: (data) => api.createNotification(data),
    listNotifications: (query) => api.listNotifications(query),
    getNotification: (id) => api.getNotification(id),
    deleteNotification: (id) => api.deleteNotification(id),
    markAsRead: (id) => api.markAsRead(id),
    markAllAsRead: (identityId) => api.markAllAsRead(identityId),
    getUnreadCount: (identityId) => api.getUnreadCount(identityId),
    batchMarkAsRead: (data) => api.batchMarkAsRead(data),
    batchDelete: (data) => api.batchDelete(data),
    cleanupOldNotifications: (data) => api.cleanupOldNotifications(data),
  };
}
