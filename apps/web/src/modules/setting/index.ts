/**
 * Setting Web Module
 * Re-exports from shared app-vue package + web-specific initialization
 */

// Store, Composables, Routes from app-vue
export {
  useUserSettingStore,
  useSettingStore,
  type UserSettingStoreType,
  useUserSetting,
  useUserSettingData,
  settingRoutes,
} from '@dailyuse/app-vue';

// Initialization (web-specific)
export { registerSettingInitializationTasks } from './initialization';
