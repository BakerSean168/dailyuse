/**
 * Shared DTO shape for notification template configuration.
 */
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

export interface ChannelConfig {
  inApp: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface NotificationTemplateConfigServerDTO {
  template: TemplateContent;
  channels: ChannelConfig;
  emailTemplate?: EmailTemplateContent | null;
  pushTemplate?: PushTemplateContent | null;
}
