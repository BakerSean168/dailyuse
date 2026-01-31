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
export * from './validation-rule-server';
export * from './validation-rule-client';
export * from './ui-config-server';
export * from './ui-config-client';
export * from './sync-config-server';
export * from './sync-config-client';
