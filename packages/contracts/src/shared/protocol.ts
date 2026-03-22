import type { AccountEventMap, AccountRpcMap } from '../modules/account/protocol';
import type { AIEventMap, AIRpcMap } from '../modules/ai/protocol';
import type { AuthEventMap, AuthRpcMap } from '../modules/authentication/protocol';
import type { EditorEventMap, EditorRpcMap } from '../modules/editor/protocol';
import type { GoalEventMap, GoalRpcMap } from '../modules/goal/protocol';
import type { NotificationEventMap, NotificationRpcMap } from '../modules/notification/protocol';
import type { ReminderEventMap, ReminderRpcMap } from '../modules/reminder/protocol';
import type { RepositoryEventMap, RepositoryRpcMap } from '../modules/repository/protocol';
import type { ScheduleEventMap, ScheduleRpcMap } from '../modules/schedule/protocol';
import type { SettingEventMap, SettingRpcMap } from '../modules/setting/protocol';
import type { TaskEventMap, TaskRpcMap } from '../modules/task/protocol';

// 1. 组装全局事件表 (Global Event Registry)
export type AppEventRegistry = 
  & AccountEventMap 
  & AIEventMap
  & AuthEventMap
  & EditorEventMap
  & GoalEventMap
  & NotificationEventMap
  & ReminderEventMap
  & RepositoryEventMap
  & ScheduleEventMap
  & SettingEventMap
  & TaskEventMap
  & { 'system:ready': void; 'system:error': Error }; // 也可以加一些全局通用的

// 2. 组装全局 RPC 表 (Global RPC Registry)
export type AppRpcRegistry = 
  & AccountRpcMap 
  & AIRpcMap
  & AuthRpcMap
  & EditorRpcMap
  & GoalRpcMap
  & NotificationRpcMap
  & ReminderRpcMap
  & RepositoryRpcMap
  & ScheduleRpcMap
  & SettingRpcMap
  & TaskRpcMap;
