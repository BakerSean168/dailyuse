/**
 * 设置常量导出
 * 
 * 统一导出所有按 category 分离的设置常量，以及最终的注册表和验证函数
 */

export { APPEARANCE_SETTINGS } from './appearance-settings.const';
export { EDITOR_SETTINGS } from './editor-settings.const';
export { TASK_SETTINGS } from './task-settings.const';
export { GOAL_SETTINGS } from './goal-settings.const';
export { REPOSITORY_SETTINGS } from './repository-settings.const';
export { NOTIFICATION_SETTINGS } from './notification-settings.const';
export { SYSTEM_SETTINGS } from './system-settings.const';
export { DEVICE_SETTINGS } from './device-settings.const';

// 最终的注册表和工具函数
export {
  SETTING_REGISTRY,
  getSettingsByCategory,
  getSyncableSettings,
  getDeviceSettings,
  validateSettingValue,
} from './setting-registry';
