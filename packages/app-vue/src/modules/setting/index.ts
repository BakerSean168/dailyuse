/**
 * Setting Module - Public Exports
 *
 * @module modules/setting
 */

// Store
export { useUserSettingStore, useSettingStore } from './stores/userSettingStore';
export type { UserSettingStoreType } from './stores/userSettingStore';

// Composables
export {
  useUserSetting,
  useUserSettingData,
  useLocaleSync,
  useThemeSync,
  applyThemeMode,
} from './composables';

// Routes
export { settingRoutes } from './router';

// Components
export * from './components';
