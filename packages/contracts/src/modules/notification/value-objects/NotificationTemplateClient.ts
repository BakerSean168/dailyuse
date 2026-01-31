/**
 * NotificationTemplate Value Object (Client)
 * �!<�a - �7�
 */

import type {
  TemplateContent,
  ChannelConfig,
  EmailTemplateContent,
  PushTemplateContent,
  NotificationTemplateConfigServerDTO,
} from './NotificationTemplateServer';

// ============ ��I ============

/**
 * �!Mn - Client ��
 */
export interface INotificationTemplateConfigClient {
  template: TemplateContent;
  channels: ChannelConfig;
  emailTemplate?: EmailTemplateContent | null;
  pushTemplate?: PushTemplateContent | null;

  // UI ��^'
  enabledChannelsCount: number;
  enabledChannelsList: string[]; // ["�(�", "��"]
  hasEmailTemplate: boolean;
  hasPushTemplate: boolean;

  // <�a��
  equals(other: INotificationTemplateConfigClient): boolean;

  // DTO lb��}

// ============ DTO �I ============

/**
 * NotificationTemplateConfig Client DTO
 */
export interface NotificationTemplateConfigClientDTO {
  template: TemplateContent;
  channels: ChannelConfig;
  emailTemplate?: EmailTemplateContent | null;
  pushTemplate?: PushTemplateContent | null;
  enabledChannelsCount: number;
  enabledChannelsList: string[];
  hasEmailTemplate: boolean;
  hasPushTemplate: boolean;
}

// ============ {��� ============

export type NotificationTemplateConfigClient = INotificationTemplateConfigClient;
