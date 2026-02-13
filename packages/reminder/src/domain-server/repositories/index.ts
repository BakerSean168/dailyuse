/**
 * Reminder Repositories
 * 提醒模块仓储接口导出
 * 
 * 【规范说明：仓储（Repository）】
 * 仓储是聚合根的持久化变量市场，应遵循以下原则：
 * - 只接口不接实现：其仓储接口帮助 DDD 的 Transactional Boundaries
 * - 单个聚合根一个仓储：一个聚合根不应该有多个仓储
 * - 聚合内的实体不会直接指接仓储：需要通过聚合根访问
 * - 根据聊天斤团决分：一次只修改一个聚合根
 * 
 * 【IReminderTemplateRepository】
 * - 提醒模板持久化：创建、修改、删除提醒模板
 * 
 * 【IReminderGroupRepository】
 * - 提醒组持久化：管理批量提醒的组织
 * 
 * 【IReminderResponseRepository】
 * - 提醒答复会话持久化：跟踪用户的提醒互动
 */

export type { IReminderTemplateRepository } from './IReminderTemplateRepository';
export type { IReminderGroupRepository } from './IReminderGroupRepository';
export type { IReminderResponseRepository, ResponseAction } from './IReminderResponseRepository';
export type { IUserReminderPreferenceRepository } from './IUserReminderPreferenceRepository';
