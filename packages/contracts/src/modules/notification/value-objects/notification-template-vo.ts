/**
 * NotificationTemplateConfig Value Object
 * 通知模板配置值对象
 */

// ============ 共享类型定义 ============

/**
 * 模板内容
 */
export interface TemplateContent {
  title: string; // 支持变量: {{variable}}
  content: string; // 支持变量和Markdown
  variables: string[]; // ['taskName', 'dueDate', etc.]
}

/**
 * 邮件模板内容
 */
export interface EmailTemplateContent {
  subject: string;
  htmlBody: string;
  textBody: string | null;
}

/**
 * 推送模板内容
 */
export interface PushTemplateContent {
  title: string;
  body: string;
  icon: string | null;
  sound: string | null;
}

/**
 * 渠道配置
 */
export interface ChannelConfig {
  inApp: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
}

// ============ 接口定义 ============

/**
 * NotificationTemplateConfig Server Interface
 */
export interface INotificationTemplateConfig {
  template: TemplateContent;
  channels: ChannelConfig;
  emailTemplate: EmailTemplateContent | null;
  pushTemplate: PushTemplateContent | null;

  // 值对象方法
  with(
    updates: Partial<
      Omit<
        INotificationTemplateConfig,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): INotificationTemplateConfig;

  // DTO 转换方法
}

/**
 * NotificationTemplateConfig Client Interface
 */
export interface INotificationTemplateConfigClient {
  template: TemplateContent;
  channels: ChannelConfig;
  emailTemplate: EmailTemplateContent | null;
  pushTemplate: PushTemplateContent | null;

  // UI 计算属性
  enabledChannelsCount: number;
  enabledChannelsList: string[]; // ["站内信", "邮件"]
  hasEmailTemplate: boolean;
  hasPushTemplate: boolean;

  // 值对象方法

  // DTO 转换方法
}

// ============ DTO 定义 ============

/**
 * NotificationTemplateConfig DTO (Server)
 */
export interface NotificationTemplateConfigDTO {
  template: TemplateContent;
  channels: ChannelConfig;
  emailTemplate: EmailTemplateContent | null;
  pushTemplate: PushTemplateContent | null;
}

/**
 * NotificationTemplateConfig Client DTO
 */
export interface NotificationTemplateConfigClientDTO {
  template: TemplateContent;
  channels: ChannelConfig;
  emailTemplate: EmailTemplateContent | null;
  pushTemplate: PushTemplateContent | null;
  enabledChannelsCount: number;
  enabledChannelsList: string[];
  hasEmailTemplate: boolean;
  hasPushTemplate: boolean;
}

/**
 * NotificationTemplateConfig Persistence DTO
 */
export interface NotificationTemplateConfigPersistenceDTO {
  template: string; // JSON.stringify(TemplateContent)
  channels: string; // JSON.stringify(ChannelConfig)
  emailTemplate: string | null; // JSON.stringify(EmailTemplateContent)
  pushTemplate: string | null; // JSON.stringify(PushTemplateContent)
}

// ============ 实现类型 ============

export type NotificationTemplateConfig = INotificationTemplateConfig;
export type NotificationTemplateConfigClient = INotificationTemplateConfigClient;

// ============ Backward Compatibility ============

/**
 * @deprecated Use NotificationTemplateConfigDTO instead
 */
export type NotificationTemplateConfigServerDTO = NotificationTemplateConfigDTO;

/**
 * @deprecated Use INotificationTemplateConfig instead
 */
export type INotificationTemplateConfigServer = INotificationTemplateConfig;

/**
 * @deprecated Use NotificationTemplateConfig instead
 */
export type NotificationTemplateConfigServer = NotificationTemplateConfig;
