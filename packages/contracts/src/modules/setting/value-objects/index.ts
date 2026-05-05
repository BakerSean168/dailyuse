/**
 * Setting Value Objects
 * 设置值对象导出
 */

// ============ Typed IDs (from primitives) ============
export type { SettingId, SettingGroupId } from '../../../primitives';

// ============ Const Object Enums ============
export { SettingValueType } from './setting-value-type';
export { SettingScope } from './setting-scope';
export { UIInputType } from './ui-input-type';
export { OperatorType } from './operator-type';
export { SettingCategory } from './setting-category';
export { ThemeMode } from './theme-mode';
export { FontSize } from './font-size';
export { TimeFormat } from './time-format';
export { TaskViewType } from './task-view-type';
export { GoalViewType } from './goal-view-type';
export { ScheduleViewType } from './schedule-view-type';
export { ProfileVisibility } from './profile-visibility';

// ============ Value Objects ============
export type {
  ValidationRuleDTO,
  ValidationRule,
} from './validation-rule';

export type {
  UIConfigDTO,
  UIConfig,
} from './ui-config';

export type {
  SyncConfigDTO,
  SyncConfig,
} from './sync-config';

export type { SettingDefinition, SettingDefinitionDTO } from './setting-definition';