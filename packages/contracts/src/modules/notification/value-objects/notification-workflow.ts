import type { NotificationChannelType } from './notification-channel-type';

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
