/**
 * Setting Value Objects
 * 设置值对象导出
 */

// ============ Typed IDs (from primitives) ============
export type { SettingId, SettingGroupId } from '@/primitives';

// ============ Const Object Enums ============
export { SettingValueType } from './setting-value-type';
export type { SettingValueType as SettingValueTypeType } from './setting-value-type';

export { SettingScope } from './setting-scope';
export type { SettingScope as SettingScopeType } from './setting-scope';

export { UIInputType } from './ui-input-type';
export type { UIInputType as UIInputTypeType } from './ui-input-type';

export { OperatorType } from './operator-type';
export type { OperatorType as OperatorTypeType } from './operator-type';

export { AppEnvironment } from './app-environment';
export type { AppEnvironment as AppEnvironmentType } from './app-environment';

export { ThemeMode } from './theme-mode';
export type { ThemeMode as ThemeModeType } from './theme-mode';

export { FontSize } from './font-size';
export type { FontSize as FontSizeType } from './font-size';

export { DateFormat } from './date-format';
export type { DateFormat as DateFormatType } from './date-format';

export { TimeFormat } from './time-format';
export type { TimeFormat as TimeFormatType } from './time-format';

export { TaskViewType } from './task-view-type';
export type { TaskViewType as TaskViewTypeType } from './task-view-type';

export { GoalViewType } from './goal-view-type';
export type { GoalViewType as GoalViewTypeType } from './goal-view-type';

export { ScheduleViewType } from './schedule-view-type';
export type { ScheduleViewType as ScheduleViewTypeType } from './schedule-view-type';

export { ProfileVisibility } from './profile-visibility';
export type { ProfileVisibility as ProfileVisibilityType } from './profile-visibility';

// ============ Value Objects ============
export type {
  ValidationRuleDTO,
  ValidationRuleClientDTO,
  ValidationRulePersistenceDTO,
  ValidationRule,
  ValidationRuleClient,
  // Backward compatibility
  ValidationRuleServerDTO,
  ValidationRuleServer,
} from './validation-rule';

export type {
  UIConfigDTO,
  UIConfigClientDTO,
  UIConfigPersistenceDTO,
  UIConfig,
  UIConfigClient,
  // Backward compatibility
  UIConfigServerDTO,
  UIConfigServer,
} from './ui-config';

export type {
  SyncConfigDTO,
  SyncConfigClientDTO,
  SyncConfigPersistenceDTO,
  SyncConfig,
  SyncConfigClient,
  // Backward compatibility
  SyncConfigServerDTO,
  SyncConfigServer,
} from './sync-config';
