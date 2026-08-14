/**
 * Reminder API Module.
 * 提醒 API 模块。
 *
 * Exposes the instance-bound reminder API transport factory for apps/api.
 * 为 apps/api 暴露实例绑定的提醒 API 传输工厂。
 *
 * Route prefix: /reminders
 * 路由前缀：/reminders
 */

export { createReminderApiModule } from './module';
export type {
  ReminderApiModuleContext,
  ReminderApiModuleDef,
  ReminderApiModuleOptions,
} from './module';
