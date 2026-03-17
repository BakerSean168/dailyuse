import {
  AccountChannels,
  AIChannels,
  AuthChannels,
  DashboardChannels,
  DesktopFeatureChannels,
  EditorChannels,
  GoalChannels,
  GovernanceChannels,
  NotificationChannels,
  ReminderChannels,
  RepositoryChannels,
  ScheduleChannels,
  SettingChannels,
  SystemChannels,
  TaskChannels,
  WindowChannels,
} from '../shared/types/ipc-channels';

export const ALLOWED_CHANNELS = [
  ...Object.values(SystemChannels),
  ...Object.values(GoalChannels),
  ...Object.values(TaskChannels),
  ...Object.values(ScheduleChannels),
  ...Object.values(ReminderChannels),
  ...Object.values(AccountChannels),
  ...Object.values(AuthChannels),
  ...Object.values(DashboardChannels),
  ...Object.values(DesktopFeatureChannels),
  ...Object.values(NotificationChannels),
  ...Object.values(RepositoryChannels),
  ...Object.values(SettingChannels),
  ...Object.values(WindowChannels),
  ...Object.values(EditorChannels),
  ...Object.values(GovernanceChannels),
  ...Object.values(AIChannels),
] as const;

export type AllowedIpcChannel = (typeof ALLOWED_CHANNELS)[number];
