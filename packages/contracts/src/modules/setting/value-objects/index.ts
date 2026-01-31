/**
 * Setting Value Objects
 * 设置值对象导出
 */

// ============ Typed IDs (from primitives) ============
export type { SettingId, SettingGroupId } from '@/primitives';

// ============ Enums ============
export { SettingValueType } from './setting-value-type';
export { SettingScope } from './setting-scope';
export { UIInputType } from './ui-input-type';
export { OperatorType } from './operator-type';
export { AppEnvironment } from './app-environment';
export { ThemeMode } from './theme-mode';
export { FontSize } from './font-size';
export { DateFormat } from './date-format';
export { TimeFormat } from './time-format';
export { TaskViewType } from './task-view-type';
export { GoalViewType } from './goal-view-type';
export { ScheduleViewType } from './schedule-view-type';
export { ProfileVisibility } from './profile-visibility';

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
