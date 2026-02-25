/**
 * Setting Module - Public Exports
 *
 * @module modules/setting
 */

// Store
export { useUserSettingStore, useSettingStore } from './stores/userSettingStore';
export type { UserSettingStoreType } from './stores/userSettingStore';

// Composables
export { useUserSetting, useUserSettingData } from './composables';

// Routes
export { settingRoutes } from './router';
