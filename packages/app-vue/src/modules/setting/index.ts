/**
 * Setting Module - Public Exports
 *
 * @module modules/setting
 */

// Store
export { useUserSettingStore } from './stores/userSettingStore';
export type { UserSettingStoreType } from './stores/userSettingStore';

// Composables
export { useUserSetting, useLocaleSync, useThemeSync, applyThemeMode } from './composables';

// Routes
export { settingRoutes } from './router';

// Components
export * from './components';
