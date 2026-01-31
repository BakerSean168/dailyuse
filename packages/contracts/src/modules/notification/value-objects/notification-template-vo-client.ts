/**
 * NotificationTemplate Value Object (Client)
 * �?<�a - �?�?
 */

import type {
  TemplateContent,
  ChannelConfig,
  EmailTemplateContent,
  PushTemplateContent,
  NotificationTemplateConfigServerDTO,
} from './notification-template-vo-server';

// ============ ��I ============

/**
 * �?Mn - Client ��
 */
export interface INotificationTemplateConfigClient {
  template: TemplateContent;
  channels: ChannelConfig;
  emailTemplate: EmailTemplateContent | null;
  pushTemplate: PushTemplateContent | null;

  // UI ��^'
  enabledChannelsCount: number;
  enabledChannelsList: string[]; // ["�?�?, "��"]
  hasEmailTemplate: boolean;
  hasPushTemplate: boolean;

  // <�a��

  // DTO lb��
}

// ============ DTO �I ============

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

// ============ {���?============

export type NotificationTemplateConfigClient = INotificationTemplateConfigClient;
