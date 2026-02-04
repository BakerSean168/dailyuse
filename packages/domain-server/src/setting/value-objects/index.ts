/**
 * Setting Module Value Objects - Domain Server
 * 
 * 从 @dailyuse/domain-shared 重新导出值对象
 */

// IDs
export {
  SettingId,
  SettingEntryId,
  SettingGroupId,
} from '@dailyuse/domain-shared/setting';

// Enum-like Value Objects
export {
  SettingValueType,
  SettingScope,
  UIInputType,
  OperatorType,
  SettingCategory,
  ThemeMode,
  FontSize,
  TimeFormat,
  TaskViewType,
  GoalViewType,
  ScheduleViewType,
  ProfileVisibility,
} from '@dailyuse/domain-shared/setting';

// Class-type Value Objects
export {
  ValidationRule,
  UIConfig,
  SyncConfig,
} from '@dailyuse/domain-shared/setting';
