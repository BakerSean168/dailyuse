import type { AccountEventMap } from '../modules/account/protocol/account-event-map';
import type { AccountRpcMap } from '../modules/account/protocol/account-rpc-map';
import type { AIEventMap } from '../modules/ai/protocol/ai-event-map';
import type { AIRpcMap } from '../modules/ai/protocol/ai-rpc-map';
import type { AuthEventMap } from '../modules/authentication/protocol/auth-event-map';
import type { AuthRpcMap } from '../modules/authentication/protocol/auth-rpc-map';
import type { EditorEventMap } from '../modules/editor/protocol/editor-event-map';
import type { EditorRpcMap } from '../modules/editor/protocol/editor-rpc-map';
import type { GoalEventMap } from '../modules/goal/protocol/goal-event-map';
import type { GoalRpcMap } from '../modules/goal/protocol/goal-rpc-map';
import type { NotificationEventMap } from '../modules/notification/protocol/notification-event-map';
import type { NotificationRpcMap } from '../modules/notification/protocol/notification-rpc-map';
import type { ReminderEventMap } from '../modules/reminder/protocol/reminder-event-map';
import type { ReminderRpcMap } from '../modules/reminder/protocol/reminder-rpc-map';
import type { RepositoryEventMap } from '../modules/repository/protocol/repository-event-map';
import type { RepositoryRpcMap } from '../modules/repository/protocol/repository-rpc-map';
import type { ScheduleEventMap } from '../modules/schedule/protocol/schedule-event-map';
import type { ScheduleRpcMap } from '../modules/schedule/protocol/schedule-rpc-map';
import type { SettingEventMap } from '../modules/setting/protocol/setting-event-map';
import type { SettingRpcMap } from '../modules/setting/protocol/setting-rpc-map';
import type { TaskEventMap } from '../modules/task/protocol/task-event-map';
import type { TaskRpcMap } from '../modules/task/protocol/task-rpc-map';

// 1. 组装全局事件表 (Global Event Registry)
export type AppEventRegistry = AccountEventMap &
  AIEventMap &
  AuthEventMap &
  EditorEventMap &
  GoalEventMap &
  NotificationEventMap &
  ReminderEventMap &
  RepositoryEventMap &
  ScheduleEventMap &
  SettingEventMap &
  TaskEventMap & { 'system:ready': void; 'system:error': Error }; // 也可以加一些全局通用的

// 2. 组装全局 RPC 表 (Global RPC Registry)
export type AppRpcRegistry = AccountRpcMap &
  AIRpcMap &
  AuthRpcMap &
  EditorRpcMap &
  GoalRpcMap &
  NotificationRpcMap &
  ReminderRpcMap &
  RepositoryRpcMap &
  ScheduleRpcMap &
  SettingRpcMap &
  TaskRpcMap;
