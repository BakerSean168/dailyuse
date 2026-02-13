/**
 * Setting Module - Domain Server
 * 设置模块 - 领域服务端
 * 
 * 【模块职责】
 * 管理系统设置和用户偏好的核心业务逻辑，包括应用配置、用户设置、设置校验等
 * 
 * 【包含内容】
 * - 聚合根（Aggregates）：Setting, AppConfig, UserSetting
 * - 实体（Entities）：SettingHistory, SettingItem, SettingGroup
 * - 值对象（Value Objects）：ValidationRule, UIConfig, SyncConfig
 * - 仓储接口（Repositories）：ISettingRepository, IAppConfigRepository, IUserSettingRepository
 * - 领域服务（Domain Services）：SettingDomainService
 * 
 * 【业务特性】
 * - 分级设置：系统默认、应用配置、用户个性化
 * - 设置分组：按功能模块分组管理
 * - 设置验证：类型检查、范围限制、业务规则
 * - 设置历史：变更跟踪、版本管理、回滚支持
 * - 配置类型：UI 配置、同步配置、行为配置
 * 
 * 【依赖规则】
 * ✅ 允许依赖：
 * - @dailyuse/utils（基类：AggregateRoot, Entity）
 * - @dailyuse/contracts（DTO 接口、事件 Map）
 * - @dailyuse/domain-shared（值对象、枚举）
 * 
 * ❌ 禁止依赖：
 * - @dailyuse/domain-client（客户端领域模型）
 * - @dailyuse/infrastructure-*（基础设施层）
 * - @dailyuse/application-*（应用层）
 * - 外部 I/O 库（fs, axios, prisma, ioredis 等）
 */

// ============ Value Objects ============
// ValidationRule, UIConfig, SyncConfig are available via
// @dailyuse/setting/domain-server value-objects directly.
// They conflict with @dailyuse/contracts/setting type exports,
// so we don't re-export them here.

// ============ 实体 ============
export { SettingHistory } from './entities/setting-history';
export { SettingItem } from './entities/setting-item';
export { SettingGroup } from './entities/setting-group';

// ============ 聚合根 ============
export { Setting } from './aggregates/setting';
export { AppConfig } from './aggregates/app-config';
export { UserSetting } from './aggregates/user-setting';

// ============ 仓储接口 ============
export type { ISettingRepository } from './repositories/ISettingRepository';
export type { IAppConfigRepository } from './repositories/IAppConfigRepository';
export type { IUserSettingRepository } from './repositories/IUserSettingRepository';

// ============ 领域服务 ============
export { SettingDomainService } from './services/SettingDomainService';
