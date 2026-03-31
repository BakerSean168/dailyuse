/**
 * Setting Module - Public Exports
 *
 * @module modules/setting
 */

// Store
export { usePresentationPreferenceStore } from './stores/presentationPreferenceStore';
export type {
  PresentationPreferenceState,
  PresentationThemeMode,
} from './stores/presentationPreferenceStore';
export { useUserSettingStore } from './stores/userSettingStore';
export type { UserSettingStoreType } from './stores/userSettingStore';

// Composables
export {
  useUserSetting,
  usePresentationBootstrap,
  useLocaleSync,
  useThemeSync,
  applyThemeMode,
} from './composables';

// Routes
export { settingRoutes } from './router';

// Components
export * from './components';
