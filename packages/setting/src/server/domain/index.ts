/**
 * Setting Module - Domain Server
 * 设置模块 - 领域服务端
 *
 * 【模块职责】
 * 管理用户偏好设置的核心业务逻辑
 *
 * 【包含内容】
 * - 聚合根（Aggregates）：UserSetting
 * - 领域错误（Errors）：SettingValidationError 等
 * - 仓储接口（Repositories）：IUserSettingRepository
 * - 值对象（Value Objects）：SettingId / UIConfig / SyncConfig 等
 *
 * 【依赖规则】
 * ✅ 允许依赖：
 * - @dailyuse/utils（基类：AggregateRoot, DomainError）
 * - @dailyuse/contracts（DTO 接口、事件 Map、Preference 类型）
 * ❌ 禁止依赖：
 * - @dailyuse/infrastructure-*（基础设施层）
 * - @dailyuse/application-*（应用层）
 * - 外部 I/O 库
 */

// ============ 聚合根 ============
export { UserSetting } from './aggregates/user-setting';
export type { UserSettingState } from './aggregates/user-setting';

// ============ 领域错误 ============
export {
  UnknownSettingKeyError,
  UnknownSettingCategoryError,
  SettingValidationError,
} from './errors';

// ============ 仓储接口 ============
export type { IUserSettingRepository } from './repositories/i-user-setting-repository';

// ============ 值对象 ============
export * from './value-objects';
