import {
  NotificationChannelType,
  NotificationWorkflowKey,
  type NotificationChannelType as NotificationChannel,
} from '@memoflow/contracts/notification';

export const NOTIFICATION_PREFERENCE_MODULES = [
  'task',
  'goal',
  'schedule',
  'reminder',
  'account',
  'system',
] as const;

export type NotificationPreferenceModule = (typeof NOTIFICATION_PREFERENCE_MODULES)[number];

export interface NotificationPreferenceWorkflowDescriptor {
  readonly id: string;
  readonly workflowKey: string;
  readonly readOnlyChannels: readonly NotificationChannel[];
}

export interface NotificationPreferenceGroupDescriptor {
  readonly id: NotificationPreferenceModule;
  readonly workflows: readonly NotificationPreferenceWorkflowDescriptor[];
}

const general = (workflowKey: string): NotificationPreferenceWorkflowDescriptor => ({
  id: 'general',
  workflowKey,
  readOnlyChannels: [],
});

/**
 * Curated user-facing preference hierarchy.
 *
 * This is deliberately not a dump of every runtime topic. Only stable product
 * workflows receive controls; unknown/future workflow overrides remain durable
 * in the preference document and are left untouched by partial updates.
 */
export const NOTIFICATION_PREFERENCE_GROUPS = [
  { id: 'task', workflows: [general(NotificationWorkflowKey.TaskGeneral)] },
  { id: 'goal', workflows: [general(NotificationWorkflowKey.GoalGeneral)] },
  { id: 'schedule', workflows: [general(NotificationWorkflowKey.ScheduleGeneral)] },
  { id: 'reminder', workflows: [general(NotificationWorkflowKey.ReminderGeneral)] },
  { id: 'account', workflows: [general(NotificationWorkflowKey.AccountGeneral)] },
  {
    id: 'system',
    workflows: [
      general(NotificationWorkflowKey.SystemGeneral),
      {
        id: 'accountSecurity',
        workflowKey: NotificationWorkflowKey.SystemAccountSecurity,
        readOnlyChannels: [NotificationChannelType.InApp, NotificationChannelType.Desktop],
      },
    ],
  },
] as const satisfies readonly NotificationPreferenceGroupDescriptor[];
