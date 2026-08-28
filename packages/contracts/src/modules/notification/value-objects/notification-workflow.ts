import type { NotificationChannelType } from './notification-channel-type';

/**
 * Stable built-in workflow identities shared by policy and presentation.
 *
 * Labels remain presentation-owned; this contract only prevents server/client
 * drift around the durable workflow keys that carry product semantics.
 */
export const NotificationWorkflowKey = {
  TaskGeneral: 'task.general',
  GoalGeneral: 'goal.general',
  ScheduleGeneral: 'schedule.general',
  ReminderGeneral: 'reminder.general',
  AccountGeneral: 'account.general',
  SystemGeneral: 'system.general',
  SystemAccountSecurity: 'system.account-security',
} as const;
export type NotificationWorkflowKey =
  (typeof NotificationWorkflowKey)[keyof typeof NotificationWorkflowKey];

export const NotificationPreferenceControl = {
  UserConfigurable: 'user_configurable',
  ReadOnly: 'read_only',
} as const;
export type NotificationPreferenceControl =
  (typeof NotificationPreferenceControl)[keyof typeof NotificationPreferenceControl];

export const NotificationDndBehavior = {
  Defer: 'defer',
  Suppress: 'suppress',
  Bypass: 'bypass',
} as const;
export type NotificationDndBehavior =
  (typeof NotificationDndBehavior)[keyof typeof NotificationDndBehavior];

export interface NotificationWorkflowChannelCapabilityDTO {
  supported: boolean;
  enabledByDefault: boolean;
  preferenceControl: NotificationPreferenceControl;
  dndBehavior: NotificationDndBehavior;
}

export interface NotificationWorkflowDefinitionDTO {
  workflowKey: string;
  topic: string;
  channels: Partial<Record<NotificationChannelType, NotificationWorkflowChannelCapabilityDTO>>;
}

export type NotificationGlobalChannelPreferencesDTO = Partial<
  Record<NotificationChannelType, boolean>
>;

export type NotificationWorkflowChannelOverrideDTO = Partial<
  Record<NotificationChannelType, boolean>
>;

export type NotificationWorkflowOverridesDTO = Record<
  string,
  NotificationWorkflowChannelOverrideDTO
>;
