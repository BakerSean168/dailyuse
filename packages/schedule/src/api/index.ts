/**
 * Schedule API Module
 * 日程 API 模块
 *
 * Exposes the instance-bound schedule API transport factory for apps/api.
 * The host composer assembles the two-phase schedule repository set, lease
 * coordinator and source executor, and passes the instance in via
 * `ScheduleApiModuleOptions`.
 *
 * 为 apps/api 暴露实例绑定的日程 API 传输工厂。宿主 composer 组装两阶段
 * schedule repository set、lease coordinator 与 source executor，并通过
 * `ScheduleApiModuleOptions` 传入实例。
 *
 * Route prefixes / 路由前缀:
 * - /schedules        (task scheduling)
 * - /schedules/events (calendar entries)
 */

export { createScheduleApiModule } from './module';
export type {
  ScheduleApiModuleContext,
  ScheduleApiModuleDef,
  ScheduleApiModuleOptions,
} from './module';
