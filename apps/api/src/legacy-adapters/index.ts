/**
 * Legacy Module Adapters
 *
 * 将旧的散落模块包装为 IApiModule 接口，
 * 使其可以被 ApiBootstrapper 统一注册。
 *
 * 迁移策略：
 * - 新模块直接实现 IApiModule（如 Governance）
 * - 旧模块通过此目录的适配器包装
 * - 待旧模块重构后，删除适配器，改为直接实现
 */

export { LegacyAccountModule } from './account';
export { LegacyAuthenticationModule } from './authentication';
