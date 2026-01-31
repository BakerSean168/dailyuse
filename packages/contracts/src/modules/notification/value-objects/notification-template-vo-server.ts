/**
 * NotificationTemplate Value Object (Server)
 * ï¿?<ï¿½a - 
ï¿½ï¿½
 */

import type { NotificationTemplateConfigClientDTO } from './notification-template-vo-client';
// ============ qï¿½{ï¿½ï¿½I ============

/**
 * !ï¿½ï¿½
 */
export interface TemplateContent {
  title: string; // /ï¿½ï¿½: {{variable}}
  content: string; // /ï¿½Ï?Markdown
  variables: string[]; // ['taskName', 'dueDate', etc.]
}

/**
 * ï¿½ï¿½!ï¿½ï¿½
 */
export interface EmailTemplateContent {
  subject: string;
  htmlBody: string;
  textBody: string | null;
}

/**
 * ï¿?!ï¿½ï¿½
 */
export interface PushTemplateContent {
  title: string;
  body: string;
  icon: string | null;
  sound: string | null;
}

/**
 *  SMn
 */
export interface ChannelConfig {
  inApp: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
}

// ============ ï¿½ï¿½I ============

/**
 * ï¿?Mn - Server ï¿½ï¿½
 */
export interface INotificationTemplateConfigServer {
  template: TemplateContent;
  channels: ChannelConfig;
  emailTemplate: EmailTemplateContent | null;
  pushTemplate: PushTemplateContent | null;

  // <ï¿½aï¿½ï¿½
  equals(other: INotificationTemplateConfigServer): boolean;
  with(
    updates: Partial<
      Omit<
        INotificationTemplateConfigServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): INotificationTemplateConfigServer;

  // DTO lbï¿½ï¿½
}

// ============ DTO ï¿½I ============

/**
 * NotificationTemplateConfig Server DTO
 */
export interface NotificationTemplateConfigServerDTO {
  template: TemplateContent;
  channels: ChannelConfig;
  emailTemplate: EmailTemplateContent | null;
  pushTemplate: PushTemplateContent | null;
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

// ============ {ï¿½ï¿½ï¿?============

export type NotificationTemplateConfigServer = INotificationTemplateConfigServer;
