/**
 * Shared DTO shape for notification template configuration.
 */

import type { ChannelPreference } from './category-preference';

// Residual 877: ChannelConfig dual retired — exact shape of ChannelPreference.
export type ChannelConfig = ChannelPreference;

export interface TemplateContent {
  title: string;
  content: string;
  variables?: string[];
}

export interface EmailTemplateContent {
  subject: string;
  htmlBody?: string | null;
  textBody?: string | null;
}

export interface PushTemplateContent {
  title: string;
  body: string;
  icon?: string | null;
  sound?: string | null;
}

export interface NotificationTemplateConfigServerDTO {
  template: TemplateContent;
  channels: ChannelConfig;
  emailTemplate?: EmailTemplateContent | null;
  pushTemplate?: PushTemplateContent | null;
}
