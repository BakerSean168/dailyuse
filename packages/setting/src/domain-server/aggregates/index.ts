/**
 * Setting Aggregates
 * 设置模块聚合根导出
 * 
 * 【规范说明：聚合根（Aggregate Root）】
 * 聚合根是 DDD 中的核心概念：
 * - 聚合的入口点：外部只能通过聚合根访问聚合内的实体
 * - 事务边界：一次事务只能修改一个聚合根
 * - 不变量守护者：确保聚合内的业务规则始终满足
 * - 领域事件发布者：状态变更时发出领域事件
 * 
 * 【Setting 聚合根】
 * - 配置项管理：应用配置、用户设置、主题、语言等
 * - 分层配置：全局配置 > 工作区配置 > 用户配置 > 设备配置
 * - 默认值管理：配置项的默认值和覆盖关系
 * - 变更追踪：记录配置变更历史
 * 
 * 【AppConfig 聚合根】
 * - 应用级配置管理：全局应用配置
 * - 功能开关：特性开关、A/B 测试配置
 * - 系统参数：超时时间、缓存配置、性能参数
 * 
 * 【UserSetting 聚合根】
 * - 用户个性化设置：主题、语言、通知偏好等
 * - 工作区设置：工作区相关的用户设置
 * - 权限配置：用户能够修改哪些设置
 */

export { Setting } from './setting';
export type { SettingState } from './setting';
export { AppConfig } from './app-config';
export type { AppConfigState } from './app-config';
export { UserSetting } from './user-setting';
export type { UserSettingState } from './user-setting';
