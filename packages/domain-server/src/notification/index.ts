/**
 * Notification Module - Domain Server
 * 通知模块 - 领域服务端
 * 
 * 【模块职责】
 * 管理通知系统的核心业务逻辑，包括通知创建、发送、偏好设置、模板管理等
 * 
 * 【包含内容】
 * - 聚合根（Aggregates）：Notification, NotificationPreference, NotificationTemplate
 * - 实体（Entities）：NotificationChannel, NotificationHistory
 * - 仓储接口（Repositories）：INotificationRepository, INotificationTemplateRepository 等
 * - 领域服务（Domain Services）：NotificationDeliveryService, NotificationBatchService
 * 
 * 【业务特性】
 * - 多渠道通知：邮件、短信、推送、站内信
 * - 通知偏好：用户可配置的通知设置
 * - 通知模板：可重用的通知内容模板
 * - 批量通知：高效的批量发送机制
 * - 通知历史：发送记录和状态跟踪
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

// Value Objects
export * from './value-objects';

// Aggregates
export * from './aggregates/notification';
export { NotificationPreference } from './aggregates/notification-preference';
export { NotificationTemplate } from './aggregates/notification-template';

// Entities
export { NotificationChannel } from './entities/notification-channel';
export { NotificationHistory } from './entities/notification-history';

// Repositories
export * from './repositories/NotificationRepository.interface';
export type { INotificationRepository } from './repositories/INotificationRepository';
export type { INotificationTemplateRepository } from './repositories/INotificationTemplateRepository';
export type { INotificationPreferenceRepository } from './repositories/INotificationPreferenceRepository';

// Services
export * from './services';
