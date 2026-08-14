/**
 * Setting API Module
 * 设置 API 模块
 *
 * Exposes the instance-bound setting API transport factory for apps/api.
 * The host composer assembles the repository set and runtime contributions and
 * passes the instance in via `SettingApiModuleOptions`.
 *
 * 为 apps/api 暴露实例绑定的设置 API 传输工厂。宿主 composer 组装 repository
 * set 与 runtime contributions，并通过 `SettingApiModuleOptions` 传入实例。
 *
 * Route prefix: /settings
 * 路由前缀：/settings
 */

export { createSettingApiModule } from './module';
export type {
  SettingApiModuleContext,
  SettingApiModuleDef,
  SettingApiModuleOptions,
} from './module';
