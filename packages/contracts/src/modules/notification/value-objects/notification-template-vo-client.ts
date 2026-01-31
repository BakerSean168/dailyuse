/**
 * NotificationTemplate Value Object (Client)
 * ï¿?<ï¿½a - ï¿?ï¿?
 */

import type {
  TemplateContent,
  ChannelConfig,
  EmailTemplateContent,
  PushTemplateContent,
  NotificationTemplateConfigServerDTO,
} from './notification-template-vo-server';

// ============ ï¿½ï¿½I ============

/**
 * ï¿?Mn - Client ï¿½ï¿½
 */
export interface INotificationTemplateConfigClient {
  template: TemplateContent;
  channels: ChannelConfig;
  emailTemplate: EmailTemplateContent | null;
  pushTemplate: PushTemplateContent | null;

  // UI ï¿½ï¿½^'
  enabledChannelsCount: number;
  enabledChannelsList: string[]; // ["ï¿?ï¿?, "ï¿½ï¿½"]
  hasEmailTemplate: boolean;
  hasPushTemplate: boolean;

  // <ï¿½aï¿½ï¿½
  equals(other: INotificationTemplateConfigClient): boolean;

  // DTO lbï¿½ï¿½
}

// ============ DTO ï¿½I ============

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

// ============ {ï¿½ï¿½ï¿?============

export type NotificationTemplateConfigClient = INotificationTemplateConfigClient;
