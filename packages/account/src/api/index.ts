/**
 * Account API Module
 * 账户 API 模块
 *
 * Exposes the instance-bound account API transport factory for apps/api.
 * 为 apps/api 暴露实例绑定的账户 API 传输工厂。
 */

export { createAccountApiModule } from './module';
export type {
  AccountApiModuleContext,
  AccountApiModuleDef,
  AccountApiModuleOptions,
} from './module';
