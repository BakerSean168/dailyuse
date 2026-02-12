/**
 * Notification Module Value Objects 导出 - 服务端
 *
 * 从 domain-shared 重新导出所有通知模块值对象
 */

// 从 domain-shared 重新导出所有值对象
export * from '../../domain-shared/value-objects';

// ============================================================
// 单独重新导出文件
// 这些文件用于更细粒度的导入，例如：
// import { CategoryPreference } from '@dailyuse/notification/domain-server/value-objects/CategoryPreference';
// ============================================================
// - CategoryPreference.ts
// - ChannelError.ts
// - ChannelResponse.ts
// - NotificationAction.ts
// - NotificationMetadata.ts
// - DoNotDisturbConfig.ts
// - RateLimit.ts
// ============================================================

// 服务端特有的值对象（不在 domain-shared 中）
export {
  NotificationTemplateConfig,
  type TemplateContent,
  type EmailTemplateContent,
  type PushTemplateContent,
  type ChannelConfig,
  type NotificationTemplateConfigServerDTO,
  type NotificationTemplateConfigServer,
} from './NotificationTemplateConfig';
