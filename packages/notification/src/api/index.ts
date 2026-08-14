/**
 * Notification API Module
 * 通知 API 模块
 *
 * Exposes the instance-bound notification API transport factory for apps/api.
 * The host composer assembles repositories, closure checker, channel
 * capabilities and transports, and passes the instance in via
 * `NotificationApiModuleOptions`.
 *
 * 为 apps/api 暴露实例绑定的通知 API 传输工厂。宿主 composer 组装 repository、
 * closure checker、channel capabilities 与 transports，并通过
 * `NotificationApiModuleOptions` 传入实例。
 *
 * Route prefix: /notifications
 * 路由前缀：/notifications
 *
 * Transport 注入（P0-3）：宿主 composer 在组装实例时选择真实 transport（Desktop /
 * Push），未提供的 capability 保持 fail-closed（production 启动对缺失 capability
 * fail-fast，绝不伪造成功）。API lane 显式声明 InApp 能力。
 */

export { createNotificationApiModule } from './module';
export type {
  NotificationApiModuleContext,
  NotificationApiModuleDef,
  NotificationApiModuleOptions,
} from './module';
