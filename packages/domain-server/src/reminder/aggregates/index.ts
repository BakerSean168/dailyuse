/**
 * Reminder Aggregates
 * 提醒模块聚合根导出
 * 
 * 【规范说明：聚合根（Aggregate Root）】
 * 聚合根是 DDD 中的核心概念：
 * - 聚合的入口点：外部只能通过聚合根访问聚合内的实体
 * - 事务边界：一次事务只能修改一个聚合根
 * - 不变量守护者：确保聚合内的业务规则始终满足
 * - 领域事件发布者：状态变更时发出领域事件
 * 
 * 【ReminderTemplate 聚合根】
 * - 提醒模板管理：可重用的提醒配置
 * - 触发规则管理：时间、事件、条件触发
 * - 重复配置：每日、每周、每月、自定义重复
 * 
 * 【ReminderGroup 聚合根】
 * - 提醒组管理：批量管理相关提醒
 * - 分组逻辑：提醒按业务版況、按类制分组
 * 
 * 【UserReminderPreferences 聚合根】
 * - 用户偏好管理：用户的提醒偏好设置
 * - 性质控制：不同频道、静音、会话时段
 */

export { ReminderTemplate } from './ReminderTemplate';
export { ReminderGroup } from './ReminderGroup';
export { UserReminderPreferences } from './UserReminderPreferences';
