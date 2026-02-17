/**
 * Notification Application Client Layer
 * 通知模块客户端应用层
 *
 * 简化版 - 只导出必要的类型和事件
 */

// Client Service
export { NotificationClientService } from './notification-client-service';

// Singleton placeholder
let _notificationApplicationService: any = null;

export function setNotificationApplicationService(service: any) {
  _notificationApplicationService = service;
}

export const notificationApplicationService: any = new Proxy({} as any, {
  get(_target, prop) {
    if (!_notificationApplicationService) {
      throw new Error('notificationApplicationService not initialized. Call setNotificationApplicationService first.');
    }
    return (_notificationApplicationService as any)[prop];
  }
});

