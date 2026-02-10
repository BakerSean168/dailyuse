/**
 * Reminder Events
 *
 * 提醒模块事件常量
 */

export const ReminderTemplateEvents = {
  TEMPLATE_CREATED: 'reminder:template:created',
  TEMPLATE_UPDATED: 'reminder:template:updated',
  TEMPLATE_DELETED: 'reminder:template:deleted',
  TEMPLATE_ENABLED: 'reminder:template:enabled',
  TEMPLATE_DISABLED: 'reminder:template:disabled',
  TEMPLATE_MOVED: 'reminder:template:moved',
} as const;

export const ReminderGroupEvents = {
  GROUP_CREATED: 'reminder:group:created',
  GROUP_UPDATED: 'reminder:group:updated',
  GROUP_DELETED: 'reminder:group:deleted',
  GROUP_STATUS_TOGGLED: 'reminder:group:status-toggled',
  GROUP_CONTROL_MODE_TOGGLED: 'reminder:group:control-mode-toggled',
} as const;

export interface ReminderTemplateRefreshEvent {
  templateUuid: string;
  reason: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface ReminderGroupRefreshEvent {
  groupUuid: string;
  reason: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}
